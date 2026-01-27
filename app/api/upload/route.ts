import { NextResponse } from 'next/server';
import { store } from '@/lib/storage';
import { generateCode } from '@/lib/codes';
import { LIMITS } from '@/lib/limits';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }

        // Generate Code
        let code = generateCode();
        let attempts = 0;
        // Check collision (Async now)
        while ((await store.get(code)) && attempts < 5) {
            code = generateCode();
            attempts++;
        }
        if (await store.get(code)) {
            return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 503 });
        }

        const filesMetadata = [];
        const fileBuffers = new Map<string, Buffer>();
        let totalSize = 0;

        for (const file of files) {
            if (file.size > LIMITS.MAX_FILE_SIZE) {
                return NextResponse.json({ error: 'File too large' }, { status: 413 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const storageKey = `dropcode:file:${code}:${uniqueId}`;

            filesMetadata.push({
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                storageKey: storageKey
            });

            fileBuffers.set(storageKey, buffer);
            totalSize += file.size;
        }

        const displayName = filesMetadata.length === 1
            ? filesMetadata[0].originalName
            : `${filesMetadata.length} files`;

        const uploadedAt = Date.now();
        const expiryMinutes = 10;
        const metadata = {
            code,
            files: filesMetadata,
            originalName: displayName,
            size: totalSize,
            uploadedAt,
            expiryMinutes,
            expiresAt: uploadedAt + (expiryMinutes * 60 * 1000),
            downloads: 0,
            maxDownloads: Infinity
        };

        // Save everything to Redis
        await store.save(code, metadata, fileBuffers);

        return NextResponse.json({
            code,
            expiresAt: metadata.expiresAt,
            originalName: displayName,
            size: totalSize,
            fileCount: filesMetadata.length
        });

    } catch (err: any) {
        console.error('Upload Error:', err);
        return NextResponse.json({ error: 'Upload failed: ' + err.message }, { status: 500 });
    }
}
