import { NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const fileData = await store.get(code);
    if (!fileData) {
        return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
    }

    return NextResponse.json({
        code: fileData.code,
        originalName: fileData.originalName,
        size: fileData.size,
        mimeType: fileData.files[0].mimeType,
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

        const fileData = await store.get(code);

        if (!fileData) {
            return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
        }

        if (expiryMinutes !== undefined) {
            const numericExpiry = parseInt(expiryMinutes);
            if ([5, 10, 30].includes(numericExpiry)) {
                fileData.expiryMinutes = numericExpiry;
                const newExpiry = fileData.uploadedAt + (numericExpiry * 60 * 1000);

                // If extending, we must update TTL in Redis!
                // The TTL is calculated from NOW in Redis, but we want it to match expiresAt
                // So TTL = expiresAt - now

                fileData.expiresAt = newExpiry;
            }
        }

        if (maxDownloads !== undefined) {
            if (maxDownloads === 'Infinity' || maxDownloads === null) {
                fileData.maxDownloads = Infinity;
            } else {
                const numericLimit = parseInt(maxDownloads);
                if (!isNaN(numericLimit) && numericLimit > 0) {
                    fileData.maxDownloads = numericLimit;
                }
            }
        }

        // Save updates (file buffers not needed, existing keys persist)
        await store.save(code, fileData);

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
