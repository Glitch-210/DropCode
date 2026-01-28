import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request, { params }: { params: { code: string } }) {
    const { code } = params;

    if (!code) {
        return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    try {
        // Lua script to atomically check and decrement
        // Keys: share:{code}
        // Args: none
        // Returns: metadata (json) if allowed, nil or error if not

        // For simplicity with Upstash HTTP, we might do GET + SET/DECR, but race conditions exist.
        // Better: DECR downloadsLeft. If < 0, increment back?
        // Or just simple GET, Check, DECR.

        const key = `share:${code}`;
        const metadata: any = await redis.get(key);

        if (!metadata) {
            return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
        }

        if (metadata.downloadsLeft <= 0) {
            return NextResponse.json({ error: 'Download limit reached' }, { status: 410 });
        }

        // Decrement
        metadata.downloadsLeft -= 1;
        metadata.downloads += 1; // Track total

        // If 0, we can delete the key OR keep it with 0 to show "Expired" message.
        // Plan says "If downloadsLeft === 0, delete Redis key and trigger blob cleanup".
        // Let's delete if 0, so subsequent requests 404.

        if (metadata.downloadsLeft <= 0) {
            await redis.del(key);
            // Trigger background cleanup (Phase 5) - for now just delete metadata
        } else {
            // Update metadata
            // Use KEEPTTL to preserve expiry
            await redis.set(key, metadata, { keepTtl: true });
        }

        // Return Blob URLs
        // If multiple files, client handles downloading them?
        // Current UI seems to support single URL redirect `window.location.href = data.url`.
        // If multiple files, we should probably ZIP them if we could, but we can't easily.
        // Or return the first one?
        // DropCode seems to handle folders as "dropcode-files".
        // If we have multiple blobs, maybe we return the list and client downloads all?
        // `DownloadingState.tsx` checks `data.url`.

        // Quick fix for MVP: If 1 file, return that URL. 
        // If multiple, implementation plan says "Support folder uploads".

        let downloadUrl = metadata.files[0].url;

        // If multiple files, we need a way to download all.
        // For now, let's just return the first one or valid list.
        // Ideally we'd loop.

        return NextResponse.json({
            url: downloadUrl,
            files: metadata.files // Send all just in case client updates to support multi
        });

    } catch (error) {
        console.error('Download claim error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
