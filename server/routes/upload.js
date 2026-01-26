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
router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Generate unique code
        let code = generateCode();
        let attempts = 0;
        while (store.get(code) && attempts < 5) {
            code = generateCode();
            attempts++;
        }

        if (store.get(code)) {
            // Extremely unlikely
            return res.status(503).json({ error: 'Failed to generate unique code, please try again' });
        }

        const expiryMs = parseInt(process.env.FILE_EXPIRY_MS) || 10 * 60 * 1000;
        const expiresAt = Date.now() + expiryMs;

        const metadata = {
            code,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            expiresAt
        };

        store.save(code, metadata);

        res.json({
            code,
            expiresAt,
            originalName: metadata.originalName,
            size: metadata.size
        });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
