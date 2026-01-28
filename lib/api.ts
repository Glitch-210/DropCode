"use client";
import { upload } from '@vercel/blob/client';
import JSZip from 'jszip';

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
    downloadsLeft?: number;
    blobUrl?: string; // New field for direct blob download
};

// Helper to generate a random 6-character code
const generateShareCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Helper to zip files (User provided logic)
export async function zipFiles(
    files: File[],
    zipName = "files.zip",
    onUpdate?: (metadata: { percent: number }) => void
): Promise<File> {
    const zip = new JSZip();

    for (const file of files) {
        // Preserve folder paths if present (webkitRelativePath)
        const path = file.webkitRelativePath || file.name;
        zip.file(path, file);
    }

    const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 } // balanced, not too slow
    }, (metadata) => {
        if (onUpdate) {
            onUpdate({ percent: metadata.percent });
        }
    });

    return new File([blob], zipName, {
        type: "application/zip"
    });
}

export const uploadFile = async (
    files: File[] | FileList,
    settings: { expiryMinutes: number, maxDownloads: number },
    onProgress?: (percent: number) => void,
    onStatus?: (status: string) => void
): Promise<any> => {
    const fileList = files instanceof FileList ? Array.from(files) : files;
    const shareCode = generateShareCode();
    let uploadedBlobs: any[] = [];
    let totalSize = 0;

    // Calculate total size for progress tracking
    fileList.forEach(f => totalSize += f.size);
    // let uploadedBytes = 0; // This is no longer used directly in the new logic

    // Phase 1: Try Direct Uploads
    // We will attempt to upload all files. If ANY fail, we switch to "Zip All" strategy.
    let failed = false;
    // We track per-file results to know if we need to rollback/discard
    const successfulUploads: any[] = [];

    // Simple tracking for direct upload progress
    const activeUploadsProgress = new Map<number, number>();
    const updateProgress = () => {
        if (onProgress) {
            let loaded = 0;
            activeUploadsProgress.forEach(v => loaded += v);
            // If we are zipping, this logic might need check, but for direct uploads:
            const percent = Math.min(100, Math.round((loaded / totalSize) * 100));
            onProgress(percent);
        }
    };

    try {
        if (onStatus) onStatus("UPLOADING FILES...");

        // Sequential upload for simplicity/safety with current error handling requirements
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];

            // Test guard (can be removed later)
            if (file.name === 'blocked.txt') {
                // Simulate failure
                throw new Error('Simulated Fail');
            }

            const pathname = `uploads/${shareCode}/${file.name}`;

            // Upload
            const blob = await upload(pathname, file, {
                access: 'public',
                handleUploadUrl: '/api/blob/upload-token',
                onUploadProgress: (evt) => {
                    activeUploadsProgress.set(i, evt.loaded);
                    updateProgress();
                }
            });

            successfulUploads.push({
                url: blob.url,
                originalName: file.name,
                size: file.size,
                mimeType: file.type,
                pathname: blob.pathname
            });

            // Mark as done for progress (ensure 100% for this file)
            activeUploadsProgress.set(i, file.size);
            updateProgress();
        }

        // If we got here, all good!
        uploadedBlobs = successfulUploads;

    } catch (err) {
        failed = true;
        console.warn("Direct upload failed, switching to ZIP Fallback", err);
    }

    // Phase 2: ZIP Fallback (if failed)
    if (failed) {
        try {
            if (onStatus) onStatus("BUNDLING FILES...");

            // Zip ALL files (discard successfulUploads)
            const zipName = fileList.length === 1 ? `${fileList[0].name}.zip` : `archive-${shareCode}.zip`;

            const zipFile = await zipFiles(fileList, zipName, (meta) => {
                // Map zip progress (0-100) to our progress UI
                // Maybe scale it? 0-50% for zip, 50-100% for upload?
                // Or just show zip progress.
                if (onProgress) onProgress(meta.percent);
            });

            if (onStatus) onStatus("UPLOADING BUNDLE...");

            const zipPathname = `uploads/${shareCode}/${zipName}`;

            const blob = await upload(zipPathname, zipFile, {
                access: 'public',
                handleUploadUrl: '/api/blob/upload-token',
                onUploadProgress: (evt) => {
                    if (onProgress) {
                        const percent = Math.round((evt.loaded / zipFile.size) * 100);
                        onProgress(percent);
                    }
                }
            });

            uploadedBlobs = [{
                url: blob.url,
                originalName: zipName,
                size: zipFile.size,
                mimeType: 'application/zip',
                pathname: blob.pathname
            }];
            // Total size is now zip size effectively, but for display we might want sum of files?
            // Metadata usually expects sum of files we shared.
            // But technically we are sharing the zip now.
            totalSize = zipFile.size;

        } catch (zipErr) {
            console.error("ZIP Fallback failed", zipErr);
            throw { error: 'Upload Failed' };
        }
    }

    // Register with Backend (Phase 3)
    try {
        const res = await fetch('/api/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shareCode,
                files: uploadedBlobs,
                settings: settings
            })
        });

        if (!res.ok) {
            throw new Error('Metadata registration failed');
        }

        const data = await res.json();

        // Return structured data expected by consumers
        return {
            code: shareCode,
            files: uploadedBlobs,
            totalSize,
            expiresAt: data.expiresAt,
            downloadsLeft: settings.maxDownloads
        };

    } catch (e: any) {
        console.error(e);
        throw { error: 'Registration Failed' };
    }
};

export const getFileMetadata = async (code: string): Promise<FileMetadata> => {
    const res = await fetch(`/api/share/${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
};

export const updateFileMetadata = async (code: string, updates: any): Promise<any> => {
    // This seems unused or legacy? Keeping for safety but it endpoint likely doesn't exist yet.
    // Implementation plan didn't mention update.
    return {};
};

// Replaces getDownloadUrl with async claim
export const claimDownload = async (code: string): Promise<{ url: string, files: any[] }> => {
    const res = await fetch(`/api/share/${encodeURIComponent(code)}/download`, {
        method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
};
// Legacy support if needed, but we should switch to claimDownload
export const getDownloadUrl = (code: string): string => {
    return `/api/share/${encodeURIComponent(code)}/download`;
};
