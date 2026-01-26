const express = require('express');
const router = express.Router();
const store = require('../utils/store');

// GET /api/file/:code
router.get('/:code', (req, res) => {
    const code = req.params.code;
    const fileData = store.get(code);

    if (!fileData) {
        return res.status(404).json({ error: 'File not found or expired' });
    }

    // Check expiry again just in case cleanup hasn't run
    if (Date.now() > fileData.expiresAt) {
        store.remove(code);
        return res.status(404).json({ error: 'File expired' });
    }

    res.json({
        code: fileData.code,
        originalName: fileData.originalName,
        size: fileData.size,
        mimeType: fileData.mimeType,
        expiresAt: fileData.expiresAt,
        fileCount: (fileData.files || []).length || 1,
        expiryMinutes: fileData.expiryMinutes || 10,
        maxDownloads: fileData.maxDownloads === Infinity ? 'Unlimited' : (fileData.maxDownloads || 'Unlimited'),
        downloads: fileData.downloads || 0
    });
});

// PATCH /api/file/:code
router.patch('/:code', (req, res) => {
    const code = req.params.code;
    const { expiryMinutes, maxDownloads } = req.body;

    const fileData = store.get(code);

    if (!fileData) {
        return res.status(404).json({ error: 'File not found or expired' });
    }

    if (expiryMinutes !== undefined) {
        // Validate expiry
        const numericExpiry = parseInt(expiryMinutes);
        if ([5, 10, 30].includes(numericExpiry)) {
            fileData.expiryMinutes = numericExpiry;
            // Recalculate expiry time based on ORIGINAL upload time
            fileData.expiresAt = fileData.uploadedAt + (numericExpiry * 60 * 1000);
        }
    }

    if (maxDownloads !== undefined) {
        // Validate maxDownloads
        if (maxDownloads === 'Infinity' || maxDownloads === null) {
            fileData.maxDownloads = Infinity;
        } else {
            const numericLimit = parseInt(maxDownloads);
            if (!isNaN(numericLimit) && numericLimit > 0) {
                fileData.maxDownloads = numericLimit;
            }
        }
    }

    // Save updated data
    store.save(code, fileData);

    res.json({
        code: fileData.code,
        expiresAt: fileData.expiresAt,
        expiryMinutes: fileData.expiryMinutes,
        maxDownloads: fileData.maxDownloads === Infinity ? 'Unlimited' : fileData.maxDownloads,
        downloads: fileData.downloads
    });
});

module.exports = router;
