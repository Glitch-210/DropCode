import { NextResponse } from 'next/server';
import { store } from '@/lib/storage';
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

// Convert Buffer to Stream
function bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const fileData = await store.get(code);

    if (!fileData) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    // Redis handles expiry automatically, so if it's there, it's valid. 
    // But we can double check logic if we want strict consistency.

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
            if (!file.storageKey) return NextResponse.json({ error: 'File data missing' }, { status: 500 });

            const buffer = await store.getFile(file.storageKey);
            if (!buffer) return NextResponse.json({ error: 'File content expired or missing' }, { status: 404 });

            const nodeStream = bufferToStream(buffer);
            responseStream = streamToWeb(nodeStream);

            headers = {
                'Content-Disposition': `attachment; filename="${file.originalName}"`,
                'Content-Type': file.mimeType || 'application/octet-stream',
                'Content-Length': file.size.toString()
            };

        } else {
            // Zip
            const archive = archiver('zip', { zlib: { level: 9 } });

            // We need to fetch all files first (parallel)
            await Promise.all(files.map(async f => {
                if (f.storageKey) {
                    const buffer = await store.getFile(f.storageKey);
                    if (buffer) {
                        archive.append(buffer, { name: f.originalName });
                    }
                }
            }));

            archive.finalize();
            responseStream = streamToWeb(archive);
            headers = {
                'Content-Disposition': `attachment; filename="dropcode-files.zip"`,
                'Content-Type': 'application/zip'
            };
        }

        // Increment Download Count
        fileData.downloads++;
        // We only save metadata back, not re-uploading files (which is efficient)
        await store.save(code, fileData);

        return new NextResponse(responseStream, { headers });

    } catch (err) {
        console.error('Download Error', err);
        return NextResponse.json({ error: 'Download failed' }, { status: 500 });
    }
}
