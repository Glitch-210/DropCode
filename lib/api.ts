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

export const uploadFile = async (files: File[] | FileList, settings: { expiryMinutes: number, maxDownloads: number }, onProgress?: (percent: number) => void): Promise<any> => {
    const fileList = files instanceof FileList ? Array.from(files) : files;
    const shareCode = generateShareCode();
    const uploadedBlobs: any[] = [];
    let totalSize = 0;

    // Calculate total size for progress tracking (simple version)
    fileList.forEach(f => totalSize += f.size);
    let uploadedBytes = 0;

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const pathname = `uploads/${shareCode}/${file.name}`;

        try {
            const blob = await upload(pathname, file, {
                access: 'public',
                handleUploadUrl: '/api/blob/upload-token', // New endpoint
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        // This event returns absolute bytes uploaded for THIS file
                        // We need to track global progress?
                        // For MVP, simplistic approximation:
                        // Let's just pass the single file progress for now to keep UI lively
                        // without complex state management.
                        // Or better: (uploadedBytesBefore + current) / total
                        const currentFilePercent = progressEvent.percentage;
                        // const totalPercent = Math.round(((uploadedBytes + (file.size * (currentFilePercent / 100))) / totalSize) * 100);
                        // onProgress(totalPercent);
                        onProgress(currentFilePercent); // Simple per-file progress
                    }
                },
            });

            uploadedBlobs.push({
                url: blob.url,
                originalName: file.name,
                size: file.size,
                mimeType: file.type,
                pathname: blob.pathname
            });
            uploadedBytes += file.size;

        } catch (err) {
            console.error(`Failed to upload ${file.name}`, err);
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
