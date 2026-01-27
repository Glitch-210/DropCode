import { NextResponse } from 'next/server';
import { store } from '@/lib/storage';
import fs from 'fs';
import archiver from 'archiver';
import { Readable } from 'stream';

export const runtime = 'nodejs';

// Helper to convert Archiver stream to Web ReadableStream
function streamToWeb(nodeStream: Readable): ReadableStream {
    return new ReadableStream({
        start(controller) {
            nodeStream.on('data', chunk => controller.enqueue(chunk));
            nodeStream.on('end', () => controller.close());
            nodeStream.on('error', err => controller.error(err));
        }
    });
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const fileData = store.get(code);
    if (!fileData) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    if (Date.now() > fileData.expiresAt) {
        store.remove(code);
        return NextResponse.json({ error: 'File expired' }, { status: 404 });
    }

    // Limit check
    if (fileData.downloads >= fileData.maxDownloads) {
        return NextResponse.json({ error: 'DOWNLOAD LIMIT REACHED' }, { status: 403 });
    }

    const files = fileData.files;
    let responseStream: ReadableStream;
    let headers: HeadersInit = {};

    try {
        if (files.length === 1) {
            const file = files[0];
            if (!fs.existsSync(file.path)) return NextResponse.json({ error: 'File missing' }, { status: 404 });

            // Single file stream
            // fs.createReadStream is a Node stream. Next.js Response expects body (Buffer, Stream, etc.)
            // We can return new NextResponse(nodeStream as any) implies we might need explicit conversion or use nodejs runtime features.
            // Using iterator for generic support:
            const nodeStream = fs.createReadStream(file.path);
            responseStream = streamToWeb(nodeStream);

            headers = {
                'Content-Disposition': `attachment; filename="${file.originalName}"`,
                'Content-Type': file.mimeType || 'application/octet-stream',
                'Content-Length': file.size.toString()
            };

        } else {
            // Zip
            const archive = archiver('zip', { zlib: { level: 9 } });

            files.forEach(f => {
                if (fs.existsSync(f.path)) {
                    archive.file(f.path, { name: f.originalName });
                }
            });
            archive.finalize();

            responseStream = streamToWeb(archive);
            headers = {
                'Content-Disposition': `attachment; filename="dropcode-files.zip"`,
                'Content-Type': 'application/zip'
            };
        }

        // Increment Download Count (Naive approach: Count on request start)
        // In real Vercel, tracking "completion" is hard without edge callbacks. 
        // We'll increment on initiation as per standard serverless limitations.
        fileData.downloads++;
        store.save(code, fileData);

        return new NextResponse(responseStream, { headers });

    } catch (err) {
        console.error('Download Error', err);
        return NextResponse.json({ error: 'Download failed' }, { status: 500 });
    }
}
