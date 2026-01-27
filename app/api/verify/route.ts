import { NextResponse } from 'next/server';
import { redis } from '@/lib/server/redis';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const fileData = await redis.get<any>(`dropcode:${code}`);

    if (!fileData) {
        return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
    }

    // Verify format matches what we stored
    const mimeType = fileData.files && fileData.files.length > 0 ? fileData.files[0].mimeType : 'application/octet-stream';

    return NextResponse.json({
        code: fileData.code,
        originalName: fileData.originalName,
        size: fileData.size,
        mimeType: mimeType,
        expiresAt: fileData.expiresAt,
        fileCount: fileData.files.length,
        expiryMinutes: fileData.expiryMinutes,
        maxDownloads: fileData.maxDownloads === Infinity ? 'Unlimited' : fileData.maxDownloads,
        downloads: fileData.downloads
    });
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { code, expiryMinutes, maxDownloads } = body;

        if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

        const fileData = await redis.get<any>(`dropcode:${code}`);

        if (!fileData) {
            return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
        }

        if (expiryMinutes !== undefined) {
            const numericExpiry = parseInt(expiryMinutes);
            if ([5, 10, 30].includes(numericExpiry)) {
                fileData.expiryMinutes = numericExpiry;
                // Update ExpiresAt visual
            }
        }

        if (maxDownloads !== undefined) {
            if (maxDownloads === 'Infinity' || maxDownloads === null) {
                fileData.maxDownloads = Infinity;
            } else {
                const numericLimit = parseInt(maxDownloads);
                fileData.maxDownloads = numericLimit;
            }
        }

        // Write back to Redis
        await redis.set(`dropcode:${code}`, fileData, { ex: 600 });

        return NextResponse.json({
            code: fileData.code,
            expiresAt: fileData.expiresAt,
            expiryMinutes: fileData.expiryMinutes,
            maxDownloads: fileData.maxDownloads === Infinity ? 'Unlimited' : fileData.maxDownloads,
            downloads: fileData.downloads
        });

    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
