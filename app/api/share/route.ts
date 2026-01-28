import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { shareCode, files, settings } = body;

        if (!shareCode || !files || files.length === 0) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Default expiry: 1 hour (3600s) if not specified, min 10 mins
        const expiryMinutes = settings?.expiryMinutes || 60;
        const ttlSeconds = expiryMinutes * 60;

        const metadata = {
            shareCode,
            files, // Array of { url, pathname, originalName, size, mimeType }
            createdAt: Date.now(),
            expiresAt: Date.now() + (ttlSeconds * 1000),
            downloadsLeft: settings?.maxDownloads || 5, // Default 5 downloads
            downloads: 0,
            originalName: files.length > 1 ? `${files.length} Files` : files[0].originalName
        };

        // Store in Redis using share:{shareCode} key
        await redis.set(`share:${shareCode}`, metadata, { ex: ttlSeconds });

        return NextResponse.json({ success: true, shareCode, expiresAt: metadata.expiresAt });

    } catch (error) {
        console.error('Metadata registration failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
