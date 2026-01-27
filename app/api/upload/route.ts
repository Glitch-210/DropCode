import { NextResponse } from 'next/server';
import { store } from '@/lib/storage';
import { generateCode } from '@/lib/codes';
import { LIMITS } from '@/lib/limits';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const runtime = 'nodejs'; // Required for fs access

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }

        // Generate unique code
        let code = generateCode();
        let attempts = 0;
        while (store.get(code) && attempts < 5) {
            code = generateCode();
            attempts++;
        }
        if (store.get(code)) {
            return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 503 });
        }

        const UPLOAD_DIR = path.join(os.tmpdir(), 'uploads');
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        const filesMetadata = [];
        let totalSize = 0;

        for (const file of files) {
            if (file.size > LIMITS.MAX_FILE_SIZE) {
                return NextResponse.json({ error: 'File too large' }, { status: 413 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
            const filePath = path.join(UPLOAD_DIR, uniqueName);

            fs.writeFileSync(filePath, buffer);

            filesMetadata.push({
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                path: filePath
            });
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

        store.save(code, metadata);

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
