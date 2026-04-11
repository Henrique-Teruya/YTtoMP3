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
        let finished = false;

        const safeReject = (err) => {
            if (!finished) {
                finished = true;
                reject(err);
            }
        };

        const safeResolve = (data) => {
            if (!finished) {
                finished = true;
                resolve(data);
            }
        };

        // Ensure downloads directory exists
        const downloadsDir = path.join(__dirname, '..', 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            try {
                fs.mkdirSync(downloadsDir, { recursive: true });
            } catch (err) {
                return safeReject(new Error(`Failed to create downloads directory: ${err.message}`));
            }
        }

        const uniqueId = Date.now();
        const outputTemplate = path.join(downloadsDir, `audio_${uniqueId}_%(title)s.%(ext)s`);

        const args = [
            '-x',
            '--audio-format', format,
            '--audio-quality', '0',
            '--max-filesize', '50M',
            '--print', 'after_move:filepath', // This prints the final filename after template expansion and conversion
            '--print', 'title',    // This prints the video title
            '-o', outputTemplate,
            '--no-playlist',
            '--restrict-filenames', // Helps with sanitization
            url
        ];

        console.log(`Starting download for URL: ${url} as ${format}`);
        const downloader = spawn('yt-dlp', args);

        let outputData = '';
        let errorData = '';

        const timeout = setTimeout(() => {
            downloader.kill();
            safeReject(new Error('Download process timed out (60s limit)'));
        }, 60000);

        downloader.stdout.on('data', (data) => {
            outputData += data.toString();
            console.log(`[yt-dlp stdout] ${data.toString().trim()}`);
        });

        downloader.stderr.on('data', (data) => {
            errorData += data.toString();
            console.log(`[yt-dlp stderr] ${data.toString().trim()}`);
        });

        downloader.on('error', (err) => {
            clearTimeout(timeout);
            console.error(`Spawn error: ${err.message}`);
            safeReject(new Error(`Failed to start yt-dlp: ${err.message}`));
        });

        downloader.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                const lines = outputData.trim().split('\n');
                const videoTitle = lines[lines.length - 1] || 'Downloaded Audio';
                const finalFilePath = lines[lines.length - 2];

                if (finalFilePath && fs.existsSync(finalFilePath.trim())) {
                    console.log(`Successfully downloaded: ${finalFilePath.trim()}`);
                    safeResolve({ filePath: finalFilePath.trim(), title: videoTitle });
                } else {
                    // Fallback search
                    const files = fs.readdirSync(downloadsDir);
                    const matchingFile = files.find(f => f.includes(`audio_${uniqueId}`) && f.endsWith(`.${format}`));
                    if (matchingFile) {
                        const filePath = path.join(downloadsDir, matchingFile);
                        safeResolve({ filePath, title: videoTitle });
                    } else {
                        safeReject(new Error('File conversion failed. Output file not found.'));
                    }
                }
            } else {
                console.error(`yt-dlp exited with code ${code}. Error: ${errorData}`);
                safeReject(new Error('Download failed. Possibly invalid URL, file too large (>50MB), or unavailable.'));
            }
        });
    });
}

/**
 * Gets video info (title and thumbnail)
 * @param {string} url
 */
async function getVideoInfo(url) {
    return new Promise((resolve, reject) => {
        let finished = false;
        const safeReject = (err) => {
            if (!finished) {
                finished = true;
                reject(err);
            }
        };
        const safeResolve = (data) => {
            if (!finished) {
                finished = true;
                resolve(data);
            }
        };

        const args = [
            '--get-title',
            '--get-thumbnail',
            '--no-playlist',
            url
        ];

        const infoProc = spawn('yt-dlp', args);
        let output = '';
        let errorOutput = '';

        const timeout = setTimeout(() => {
            infoProc.kill();
            safeReject(new Error('Fetching video info timed out'));
        }, 30000);

        infoProc.stdout.on('data', (data) => {
            output += data.toString();
        });

        infoProc.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        infoProc.on('error', (err) => {
            clearTimeout(timeout);
            safeReject(new Error(`Failed to start yt-dlp info process: ${err.message}`));
        });

        infoProc.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                const lines = output.trim().split('\n');
                safeResolve({
                    title: lines[0] || 'Unknown Title',
                    thumbnail: lines[1] || ''
                });
            } else {
                console.error(`yt-dlp info error: ${errorOutput}`);
                safeReject(new Error('Failed to get video info. Check if the URL is valid.'));
            }
        });
    });
}

module.exports = { downloadAudio, getVideoInfo };
