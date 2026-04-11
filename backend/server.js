const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { downloadAudio, getVideoInfo } = require('./downloader');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

/**
 * POST /info
 * Fetches video title and thumbnail
 */
app.post('/info', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const info = await getVideoInfo(url);
        res.json(info);
    } catch (error) {
        console.error('Info fetch error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to fetch video info' });
    }
});

/**
 * POST /download
 * Downloads audio and returns the file
 */
app.post('/download', async (req, res) => {
    const { url, format } = req.body;

    // Basic validation
    if (!url || !format) {
        return res.status(400).json({ error: 'URL and format are required' });
    }

    const validFormats = ['mp3', 'wav', 'flac'];
    if (!validFormats.includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Supported: mp3, wav, flac' });
    }

    try {
        const { filePath, title } = await downloadAudio(url, format);

        // Sanitize title for Content-Disposition header
        const safeTitle = title.replace(/[^\x20-\x7E]/g, '');
        const downloadName = `${safeTitle || 'audio'}.${format}`;

        res.download(filePath, downloadName, (err) => {
            if (err) {
                console.error('Error during file transfer:', err.message);
            }

            // Cleanup: delete temporary file after sending or failure
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Cleanup error:', unlinkErr.message);
                else console.log(`Cleaned up: ${filePath}`);
            });
        });
    } catch (error) {
        console.error('Download error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to process audio' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
