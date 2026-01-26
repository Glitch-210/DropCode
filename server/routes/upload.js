const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const store = require('../utils/store');
const { generateCode } = require('../utils/codegen');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // We rely on index.js to ensure this directory exists
        cb(null, process.env.UPLOAD_DIR || 'tmp/uploads');
    },
    filename: (req, file, cb) => {
        // Keep original extension, but use unique name to prevent overwrites slightly
        // though we map by code, so filename collision isn't critical unless highly concurrent same-millisecond
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB
});

// POST /api/upload
router.post('/', (req, res) => {
    upload.array('files')(req, res, (err) => {
        // Function to cleanup files if ANY error occurs
        const cleanupFiles = () => {
            if (req.files) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlink(file.path, () => { }); // Async unlink, ignore error
                    }
                });
            }
        };

        if (err) {
            console.error('Multer error:', err);
            cleanupFiles();
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'File too large' });
            }
            if (err.code === 'ENOSPC') {
                return res.status(507).json({ error: 'STORAGE FULL — TRY AGAIN LATER' });
            }
            return res.status(400).json({ error: 'Upload failed: ' + err.message });
        }

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Listen for request abort (Client disconnects)
        req.on('close', () => {
            if (!res.headersSent) {
                console.log('Request aborted by client, cleaning up...');
                cleanupFiles();
            }
        });

        try {
            // Generate unique code
            let code = generateCode();
            let attempts = 0;
            while (store.get(code) && attempts < 5) {
                code = generateCode();
                attempts++;
            }

            if (store.get(code)) {
                cleanupFiles();
                return res.status(503).json({ error: 'Failed to generate unique code, please try again' });
            }

            const uploadedAt = Date.now();
            const expiryMinutes = 10; // Default
            const expiryMs = expiryMinutes * 60 * 1000;
            const expiresAt = uploadedAt + expiryMs;

            // Map files to metadata format
            const filesMetadata = req.files.map(file => ({
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                path: file.path
            }));

            // Calculate total size and determine primary name for display
            const totalSize = filesMetadata.reduce((acc, curr) => acc + curr.size, 0);
            const displayName = filesMetadata.length === 1
                ? filesMetadata[0].originalName
                : `${filesMetadata.length} files`;

            const metadata = {
                code,
                files: filesMetadata,
                originalName: displayName,
                size: totalSize,
                uploadedAt,
                expiryMinutes,
                expiresAt,
                downloads: 0,
                maxDownloads: Infinity // Default unlimited
            };

            store.save(code, metadata);

            res.json({
                code,
                expiresAt,
                originalName: displayName,
                size: totalSize,
                fileCount: filesMetadata.length
            });

        } catch (err) {
            console.error('Upload handler error:', err);
            cleanupFiles();
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

module.exports = router;
