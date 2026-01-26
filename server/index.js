const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'tmp/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} else {
    // Edge Case 15: Server Restart - Cleanup orphans
    console.log('Cleaning up orphaned files...');
    fs.readdirSync(UPLOAD_DIR).forEach(file => {
        const filePath = path.join(UPLOAD_DIR, file);
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error(`Failed to delete orphan ${filePath}:`, err);
        }
    });
}

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json()); // Support JSON body for PATCH
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/file', require('./routes/file'));
app.use('/api/download', require('./routes/download'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uploadDir: UPLOAD_DIR });
});

const store = require('./utils/store');

// Start backend cleanup job (every 60 seconds)
setInterval(() => {
    store.cleanup();
}, 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Upload directory: ${UPLOAD_DIR}`);
});
