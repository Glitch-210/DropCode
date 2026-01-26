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

    // Check if file exists on disk
    if (!fs.existsSync(fileData.path)) {
        store.remove(code);
        return res.status(404).json({ error: 'File missing from server' });
    }

    // Download file
    res.download(fileData.path, fileData.originalName, (err) => {
        if (err) {
            console.error('Download error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error downloading file' });
            }
        }
    });
});

module.exports = router;
