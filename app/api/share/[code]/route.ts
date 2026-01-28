import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: Request, { params }: { params: { code: string } }) {
    const { code } = params;

    if (!code) {
        return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    try {
        const metadata: any = await redis.get(`share:${code}`);

        if (!metadata) {
            return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
        }

        if (metadata.downloadsLeft <= 0) {
            // Cleanup might happen here or async, for now just report gone
            return NextResponse.json({ error: 'Download limit reached' }, { status: 410 });
        }

        // Return safe metadata (NO Blob URLs)
        return NextResponse.json({
            code: metadata.shareCode,
            originalName: metadata.originalName,
            size: metadata.files.reduce((acc: number, f: any) => acc + f.size, 0),
            downloadsLeft: metadata.downloadsLeft,
            expiresAt: metadata.expiresAt,
            fileCount: metadata.files.length
        });

    } catch (error) {
        console.error('Metadata fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
