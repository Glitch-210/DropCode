/**
 * Simple in-memory file store for MVP.
 * Maps short codes to file metadata.
 */
class FileStore {
    constructor() {
        this.store = new Map();
    }

    /**
     * Save file metadata locally.
     * @param {string} code - The generated short code
     * @param {Object} metadata - File metadata (path, name, mimeType, size, expiresAt)
     */
    save(code, metadata) {
        this.store.set(code.toUpperCase(), metadata);
    }

    /**
     * Retrieve file metadata by code.
     * @param {string} code 
     * @returns {Object|null}
     */
    get(code) {
        return this.store.get(code.toUpperCase()) || null;
    }

    /**
     * Remove file from store (does not delete from disk, caller must handle that).
     * @param {string} code 
     */
    remove(code) {
        this.store.delete(code.toUpperCase());
    }

    /**
     * Get all entries (useful for cleanup).
     * @returns {Iterator}
     */
    entries() {
        return this.store.entries();
    }

    /**
     * cleanup expired files
     */
    cleanup() {
        const now = Date.now();
        let count = 0;
        const fs = require('fs');

        for (const [code, metadata] of this.store.entries()) {
            if (now > metadata.expiresAt) {
                // Remove files from disk
                // Support both legacy (single file) and new (array) structure for backward compatibility
                const files = metadata.files || [metadata]; // Handle legacy or single file structure if needed

                files.forEach(file => {
                    try {
                        if (file.path && fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    } catch (err) {
                        console.error(`Failed to delete file ${file.path}:`, err);
                    }
                });

                // Remove from store
                this.store.delete(code);
                count++;
            }
        }
        if (count > 0) {
            console.log(`Cleanup: Removed ${count} expired files`);
        }
    }
}

// Singleton instance
module.exports = new FileStore();
