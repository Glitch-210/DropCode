import { redis } from './redis';

export type FileMetadata = {
    code: string;
    files: Array<{
        originalName: string;
        mimeType: string;
        size: number;
        storageKey?: string;
        path?: string;
        url?: string;
    }>;
    originalName: string;
    size: number;
    uploadedAt: number;
    expiryMinutes: number;
    expiresAt: number;
    downloads: number;
    maxDownloads: number;
};

export const store = {
    async get(code: string): Promise<FileMetadata | null> {
        return await redis.get(`dropcode:${code}`);
    },

    async save(code: string, metadata: FileMetadata) {
        await redis.set(`dropcode:${code}`, metadata, { ex: metadata.expiryMinutes * 60 });
    },

    async cleanup() {
        console.log('Cleanup handled by Redis TTL');
    }
};
