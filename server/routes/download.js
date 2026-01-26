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

    // Check download limits
    if (fileData.downloads >= fileData.maxDownloads) {
        if (files.length === 1 && !res.headersSent) {
            return res.status(403).json({ error: 'DOWNLOAD LIMIT REACHED' });
        }
        // Also block zip downloads
        if (files.length > 1 && !res.headersSent) {
            return res.status(403).json({ error: 'DOWNLOAD LIMIT REACHED' });
        }
    }

    // Callback for successful download tracking
    const onDownloadComplete = (err) => {
        if (!err) {
            fileData.downloads = (fileData.downloads || 0) + 1;
            store.save(code, fileData); // Update store
            console.log(`Download complete for ${code}. Count: ${fileData.downloads}/${fileData.maxDownloads}`);
        } else {
            console.error('Download aborted:', err);
            // Do not increment on failure
        }
    };

    // If single file, download directly
    if (files.length === 1) {
        const file = files[0];
        if (!fs.existsSync(file.path)) {
            return res.status(404).json({ error: 'File missing from server' });
        }
        return res.download(file.path, file.originalName, onDownloadComplete);
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
            res.status(500).json({ error: 'FAILED TO PACKAGE FILES' });
        }
    });

    // Listen for finish evt to count success
    res.on('finish', () => {
        onDownloadComplete(null);
    });

    // Handle abort
    res.on('close', () => {
        // If request closed prematurely, headers might be sent but response not finished
        // Express doesn't easily expose "finished successfully" vs "aborted" in 'close'
        // But 'finish' fires on success.
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
