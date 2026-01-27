import fs from 'fs';

export type FileMetadata = {
    code: string;
    files: Array<{
        originalName: string;
        mimeType: string;
        size: number;
        path: string;
    }>;
    originalName: string;
    size: number;
    uploadedAt: number;
    expiryMinutes: number;
    expiresAt: number;
    downloads: number;
    maxDownloads: number;
};

// Global store to persist across hot-reloads/warm lambdas
const globalStore = (global as any).fileStore || new Map<string, FileMetadata>();
(global as any).fileStore = globalStore;

export const store = {
    save(code: string, metadata: FileMetadata) {
        globalStore.set(code.toUpperCase(), metadata);
    },

    get(code: string): FileMetadata | null {
        return globalStore.get(code.toUpperCase()) || null;
    },

    remove(code: string) {
        globalStore.delete(code.toUpperCase());
    },

    cleanup() {
        const now = Date.now();
        let count = 0;
        for (const [code, metadata] of globalStore.entries()) {
            if (now > metadata.expiresAt) {
                // Remove files from disk
                const files = metadata.files || [metadata];
                files.forEach((file: any) => {
                    try {
                        if (file.path && fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    } catch (err) {
                        console.error(`Failed to delete file ${file.path}:`, err);
                    }
                });
                globalStore.delete(code);
                count++;
            }
        }
        if (count > 0) console.log(`Cleanup: Removed ${count} expired files`);
    }
};
