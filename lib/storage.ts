import { redis } from './redis';

export type FileMetadata = {
    code: string;
    files: Array<{
        originalName: string;
        mimeType: string;
        size: number;
        storageKey?: string; // Redis key for file content
        path?: string; // Legacy support (optional)
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
    async save(code: string, metadata: FileMetadata, fileBuffers?: Map<string, Buffer>) {
        const pipeline = redis.pipeline();

        // 1. Save Metadata
        pipeline.set(`dropcode:${code}`, metadata, { ex: metadata.expiryMinutes * 60 });

        // 2. Save File Content (if provided)
        if (fileBuffers) {
            for (const [key, buffer] of fileBuffers.entries()) {
                // Store as base64 to ensure safe transport via JSON-based Redis REST
                // Note: usage of base64 increases size by ~33%. 
                // For production large files, Blob Storage is recommended.
                pipeline.set(key, buffer.toString('base64'), { ex: metadata.expiryMinutes * 60 });
            }
        }

        await pipeline.exec();
    },

    async get(code: string): Promise<FileMetadata | null> {
        return await redis.get(`dropcode:${code}`);
    },

    async getFile(key: string): Promise<Buffer | null> {
        const base64 = await redis.get<string>(key);
        if (!base64) return null;
        return Buffer.from(base64, 'base64');
    },

    async remove(code: string) {
        const metadata = await this.get(code);
        if (metadata) {
            const keysToDelete = [`dropcode:${code}`];
            metadata.files.forEach(f => {
                if (f.storageKey) keysToDelete.push(f.storageKey);
            });
            await redis.del(...keysToDelete);
        }
    },

    async cleanup() {
        // Redis handles expiry automatically via TTL (ex)
        // No manual cleanup needed for Vercel
        console.log('Cleanup: Handled by Redis TTL');
    }
};
