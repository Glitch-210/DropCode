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
        fileCount: (fileData.files || []).length || 1
    });
});

module.exports = router;
