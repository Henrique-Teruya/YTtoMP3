const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Downloads audio from YouTube and converts it to the specified format.
 * @param {string} url - The YouTube URL.
 * @param {string} format - The desired audio format (mp3, wav, flac).
 * @returns {Promise<Object>} - A promise that resolves with the file path and title.
 */
async function downloadAudio(url, format) {
    return new Promise((resolve, reject) => {
        const outputTemplate = path.join(__dirname, '..', 'downloads', '%(title)s.%(ext)s');

        // Get video title first
        const getTitle = spawn('yt-dlp', ['--get-title', url]);
        let title = '';

        getTitle.stdout.on('data', (data) => {
            title += data.toString().trim();
        });

        getTitle.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error('Failed to fetch video title.'));
            }

            // Sanitize title for filename (simple version)
            const sanitizedTitle = title.replace(/[^\w\s-]/gi, '').trim();
            const outputPath = path.join(__dirname, '..', 'downloads', `${sanitizedTitle}.${format}`);

            const args = [
                '-x',
                '--audio-format', format,
                '--audio-quality', '0',
                '-o', path.join(__dirname, '..', 'downloads', `${sanitizedTitle}.%(ext)s`),
                '--no-playlist',
                url
            ];

            const downloader = spawn('yt-dlp', args);

            downloader.on('error', (err) => {
                reject(err);
            });

            downloader.on('close', (code) => {
                if (code === 0) {
                    if (fs.existsSync(outputPath)) {
                        resolve({ filePath: outputPath, title: title });
                    } else {
                        reject(new Error('File conversion failed.'));
                    }
                } else {
                    reject(new Error(`yt-dlp exited with code ${code}`));
                }
            });
        });
    });
}

/**
 * Gets video info (title and thumbnail)
 * @param {string} url
 */
async function getVideoInfo(url) {
    return new Promise((resolve, reject) => {
        const args = [
            '--get-title',
            '--get-thumbnail',
            '--no-playlist',
            url
        ];

        const infoProc = spawn('yt-dlp', args);
        let output = '';

        infoProc.stdout.on('data', (data) => {
            output += data.toString();
        });

        infoProc.on('close', (code) => {
            if (code === 0) {
                const lines = output.trim().split('\n');
                resolve({
                    title: lines[0],
                    thumbnail: lines[1]
                });
            } else {
                reject(new Error('Failed to get video info.'));
            }
        });
    });
}

module.exports = { downloadAudio, getVideoInfo };
