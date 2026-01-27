import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { generateCode } from '@/lib/codes';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { files, totalSize } = body;
        // files: Array<{ url, originalName, size, mimeType }>

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files registered' }, { status: 400 });
        }

        const code = generateCode(); // 5 chars

        // Check collision? Redis SET NX?
        // Simple collision check
        if (await redis.exists(`dropcode:${code}`)) {
            return NextResponse.json({ error: 'Collision (Try Again)' }, { status: 503 });
        }

        const uploadedAt = Date.now();
        const expiryMinutes = 10;
        const displayName = files.length === 1 ? files[0].originalName : `${files.length} files`;

        const metadata = {
            code,
            files, // Contains Blob URLs
            originalName: displayName,
            size: totalSize || 0,
            uploadedAt,
            expiryMinutes,
            expiresAt: uploadedAt + (expiryMinutes * 60 * 1000),
            downloads: 0,
            maxDownloads: Infinity
        };

        // Store in Redis
        await redis.set(`dropcode:${code}`, metadata, { ex: 600 }); // 10 mins

        return NextResponse.json({
            code,
            expiresAt: metadata.expiresAt,
            originalName: displayName,
            size: totalSize,
            fileCount: files.length
        });

    } catch (err: any) {
        console.error('Registration Error:', err);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
