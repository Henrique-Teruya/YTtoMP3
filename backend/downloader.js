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
        // Use a unique ID to prevent filename collisions
        const uniqueId = Date.now();
        const tempFilename = `audio_${uniqueId}`;
        const downloadsDir = path.join(__dirname, '..', 'downloads');
        const outputPath = path.join(downloadsDir, `${tempFilename}.${format}`);

        // Get video title first for a nice filename for the user
        const getTitle = spawn('yt-dlp', ['--get-title', '--no-playlist', url]);
        let title = '';

        const timeout = setTimeout(() => {
            getTitle.kill();
            reject(new Error('Process timed out while fetching video title.'));
        }, 30000); // 30 seconds timeout

        getTitle.stdout.on('data', (data) => {
            title += data.toString().trim();
        });

        getTitle.on('close', (code) => {
            clearTimeout(timeout);
            if (code !== 0) {
                return reject(new Error('Failed to fetch video title. Invalid URL or network issue.'));
            }

            // Clean title for logs/display (sanitize for safe filename)
            const displayTitle = (title || 'audio').replace(/[^\w\s-]/gi, '').trim() || 'audio';

            const args = [
                '-x',
                '--audio-format', format,
                '--audio-quality', '0',
                '-o', path.join(downloadsDir, `${tempFilename}.%(ext)s`),
                '--no-playlist',
                '--max-filesize', '50M', // Basic protection: limit file size
                url
            ];

            const downloader = spawn('yt-dlp', args);

            const downloadTimeout = setTimeout(() => {
                downloader.kill();
                reject(new Error('Download process timed out.'));
            }, 300000); // 5 minutes timeout

            downloader.on('error', (err) => {
                clearTimeout(downloadTimeout);
                reject(err);
            });

            downloader.on('close', (code) => {
                clearTimeout(downloadTimeout);
                if (code === 0) {
                    if (fs.existsSync(outputPath)) {
                        resolve({ filePath: outputPath, title: displayTitle });
                    } else {
                        reject(new Error('File conversion failed. Output file not found.'));
                    }
                } else {
                    reject(new Error(`yt-dlp failed with exit code ${code}`));
                }
            });

            // Log progress
            downloader.stderr.on('data', (data) => {
                const message = data.toString();
                if (message.includes('%')) {
                    console.log(`[Download Progress]: ${message.trim()}`);
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

        const timeout = setTimeout(() => {
            infoProc.kill();
            reject(new Error('Timed out fetching video info.'));
        }, 15000);

        infoProc.stdout.on('data', (data) => {
            output += data.toString();
        });

        infoProc.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                const lines = output.trim().split('\n');
                resolve({
                    title: lines[0],
                    thumbnail: lines[1]
                });
            } else {
                reject(new Error('Failed to get video info. Check if the URL is correct.'));
            }
        });
    });
}

module.exports = { downloadAudio, getVideoInfo };
