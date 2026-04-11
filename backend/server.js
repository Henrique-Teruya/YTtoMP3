const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { downloadAudio, getVideoInfo } = require('./downloader');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Endpoint to get video info (bonus)
app.post('/info', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const info = await getVideoInfo(url);
        res.json(info);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

// Endpoint to download audio
app.post('/download', async (req, res) => {
    const { url, format } = req.body;

    if (!url || !format) {
        return res.status(400).json({ error: 'URL and format are required' });
    }

    const validFormats = ['mp3', 'wav', 'flac'];
    if (!validFormats.includes(format)) {
        return res.status(400).json({ error: 'Invalid format' });
    }

    try {
        const { filePath, title } = await downloadAudio(url, format);

        res.download(filePath, `${title}.${format}`, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }

            // Delete temporary file after sending
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
            });
        });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to process audio' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
