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
                // Remove from disk
                try {
                    if (fs.existsSync(metadata.path)) {
                        fs.unlinkSync(metadata.path);
                    }
                } catch (err) {
                    console.error(`Failed to delete file ${metadata.path}:`, err);
                }
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
