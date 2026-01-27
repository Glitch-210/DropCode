import { NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const fileData = store.get(code);
    if (!fileData) {
        return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
    }

    if (Date.now() > fileData.expiresAt) {
        store.remove(code);
        return NextResponse.json({ error: 'File expired' }, { status: 404 });
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
    // We expect code in query param or body? User used /api/file/:code -> PATCH. 
    // In Next.js App Router, we can use dynamic route /api/verify/[code]/route.ts OR just parse body.
    // The previous implementation used :code param. 
    // BUT the target structure requested `app/api/verify/route.ts` (not dynamic folder).
    // So we must expect the code in the body or query. I'll check body.

    // Actually, I should probably check if the user accidentally meant [code].
    // But adhering to "Target Folder Structure" strictly: `app/api/verify/route.ts`.
    // I will extract code from Body for PATCH.

    try {
        const body = await req.json(); // { code, expiryMinutes, maxDownloads }
        // Wait, if the client sends PATCH to /api/file/CODE, I need to support that URL structure 
        // OR change the client.
        // User said "Move all frontend code... Do not change UI, styling".
        // The Client calls `api.js` -> `${API_BASE}/file/${code}`.
        // This means I MUST use `app/api/file/[code]/route.ts`?
        // The TARGET STRUCTURE lists `verify/route.ts`.
        // This is a CONTRADICTION.
        // Strategies:
        // 1. Rewrite `api.js` to point to `/api/verify?code=...` (This changes frontend logic slightly, allowed if structure mandates it).
        // 2. Use `next.config.js` rewrites to map `/api/file/:code` -> `/api/verify?code=:code`.

        // Strategy 1 is cleaner for specific Next.js code. I will modify `lib/api.ts` (the ported Client API) to match the new routes.

        const { code, expiryMinutes, maxDownloads } = body;
        if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

        const fileData = store.get(code);

        if (!fileData) {
            return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
        }

        if (expiryMinutes !== undefined) {
            const numericExpiry = parseInt(expiryMinutes);
            if ([5, 10, 30].includes(numericExpiry)) {
                fileData.expiryMinutes = numericExpiry;
                fileData.expiresAt = fileData.uploadedAt + (numericExpiry * 60 * 1000);
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

        store.save(code, fileData);

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
