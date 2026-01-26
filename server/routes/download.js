const express = require('express');
const router = express.Router();
const store = require('../utils/store');
const fs = require('fs');

// GET /api/download/:code
router.get('/:code', (req, res) => {
    const code = req.params.code;
    const fileData = store.get(code);

    if (!fileData) {
        return res.status(404).json({ error: 'File not found or expired' });
    }

    if (Date.now() > fileData.expiresAt) {
        store.remove(code);
        return res.status(404).json({ error: 'File expired' });
    }

    // Handle new metadata structure (array of files)
    const files = fileData.files || [fileData]; // Backward compat

    // If single file, download directly
    if (files.length === 1) {
        const file = files[0];
        if (!fs.existsSync(file.path)) {
            return res.status(404).json({ error: 'File missing from server' });
        }
        return res.download(file.path, file.originalName, (err) => {
            if (err && !res.headersSent) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Error downloading file' });
            }
        });
    }

    // If multiple files, zip them
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment('dropcode-files.zip');

    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            console.warn(err);
        } else {
            throw err;
        }
    });

    archive.on('error', function (err) {
        console.error('Zip error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error creating zip' });
        }
    });

    archive.pipe(res);

    files.forEach(file => {
        if (fs.existsSync(file.path)) {
            archive.file(file.path, { name: file.originalName });
        }
    });

    archive.finalize();
});

module.exports = router;
