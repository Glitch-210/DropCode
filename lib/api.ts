"use client";
import { upload } from '@vercel/blob/client';

const API_BASE = '/api';

export type FileMetadata = {
    code: string;
    originalName: string;
    size: number;
    mimeType: string;
    expiresAt: number;
    fileCount: number;
    expiryMinutes: number;
    maxDownloads: string | number;
    downloads: number;
    blobUrl?: string; // New field for direct blob download
};

export const uploadFile = async (files: File[] | FileList, onProgress?: (percent: number) => void): Promise<any> => {
    const fileList = files instanceof FileList ? Array.from(files) : files;

    // Vercel Blob (Client Upload)
    // Multi-file not natively supported in single call yet, doing sequential for MVP.
    // Or parallel.

    // Actually, Prompt Requirement: "Upload files directly from the browser to Blob... Store { code -> blobUrl } in Redis"
    // Does DropCode support multi-file? Yes. 'dropcode-files.zip'.
    // Vercel Blob is object storage. Zipping on client is hard/slow.
    // Strategy: Upload individual files to Blob. Send ALL Blob URLs to Backend. Backend registers them.
    // Download: Backend returns list of URLs? Or Backend streams them to Zip?
    // "Downloader... uses code -> Redis -> blob URL -> download"
    // If multi-file, we might need to zip in Lambda (Backend) but that requires fetching from Blob.
    // Fetching from Blob in Lambda is fast.

    // Let's implement client-side upload loop.
    const uploadedBlobs = [];
    let totalSize = 0;

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        totalSize += file.size;

        // Upload to Blob
        try {
            const blob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/blob-upload` : '/api/blob-upload',
                onUploadProgress: (progressEvent) => {
                    // Primitive total progress calculation
                    // This reports progress for CURRENT file.
                    // Ideally we weight it.
                    // For MVP, just passing current file progress might look jumpy.
                    // Let's try to smooth it? Or just pass it.
                    if (onProgress) {
                        const percent = Math.round((progressEvent.percentage));
                        onProgress(percent);
                    }
                },
            });
            uploadedBlobs.push({
                url: blob.url,
                originalName: file.name,
                size: file.size,
                mimeType: file.type
            });
        } catch (err) {
            console.error(err);
            throw { error: 'Blob Upload Failed' };
        }
    }

    // Register with Backend
    // We send the list of blobs.
    try {
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                files: uploadedBlobs,
                totalSize // explicitly sending, though backend could sum
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw err;
        }

        return await res.json();
    } catch (e: any) {
        throw { error: e.error || 'Registration Failed' };
    }
};

export const getFileMetadata = async (code: string): Promise<FileMetadata> => {
    const res = await fetch(`${API_BASE}/verify?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
};

export const updateFileMetadata = async (code: string, updates: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, ...updates })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
};

// With Blob, the "Download URL" might be the blob URL directly OR the API proxy.
// Prompt says: "Frontend should redirect to the returned URL."
// So this function might need to be async or just return the API endpoint that does the redirect logic?
// Current usage: window.location.href = getDownloadUrl(code);
// If we change this to return the API, and API returns JSON, this breaks.
// Refactoring Components required.
// For now, let's keep this returning the API url, and update the Component to fetch.
export const getDownloadUrl = (code: string): string => {
    return `${API_BASE}/download?code=${encodeURIComponent(code)}`;
};
