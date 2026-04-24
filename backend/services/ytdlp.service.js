/**
 * YTMP3 PRO — yt-dlp Service
 *
 * Core service wrapping yt-dlp via child_process.spawn().
 * Provides real-time progress parsing and timeout control.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');
const { DownloadError, TimeoutError } = require('../utils/errors');
const { sanitizeFilename } = require('../utils/sanitizer');

/**
 * Fetch video metadata without downloading.
 * @param {string} url - Validated YouTube URL
 * @returns {Promise<object>} Video info (title, thumbnail, duration, channel, etc.)
 */
async function getVideoInfo(url) {
  const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
  const hasCookies = fs.existsSync(cookiesPath);

  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      '--no-playlist',
      '--no-colors',
      '--ignore-config',
      '--no-cache-dir',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
    ];

    if (hasCookies) {
      args.push('--cookies', cookiesPath);
    }

    args.push(url);

    logger.debug(`yt-dlp info: ${config.ytDlpPath} ${args.join(' ')}`);

    const proc = spawn(config.ytDlpPath, args, {
      timeout: 30_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new TimeoutError('Video info fetch timed out'));
    }, 30_000);

    proc.on('close', (code) => {
      clearTimeout(timer);

      if (code !== 0) {
        logger.error('yt-dlp info failed', { code, stderr: stderr.trim() });

        if (stderr.includes('Private video') || stderr.includes('Sign in to confirm')) {
          return reject(new DownloadError('This video is private or requires authentication'));
        }
        if (stderr.includes('Video unavailable') || stderr.includes('not available')) {
          return reject(new DownloadError('This video is unavailable'));
        }
        if (stderr.includes('is not a valid URL')) {
          return reject(new DownloadError('Invalid video URL'));
        }

        return reject(new DownloadError(`Failed to fetch video info: ${stderr.trim().slice(0, 200)}`));
      }

      try {
        const data = JSON.parse(stdout);
        resolve({
          id: data.id,
          title: data.title || 'Untitled',
          thumbnail: data.thumbnail || data.thumbnails?.[data.thumbnails.length - 1]?.url || null,
          duration: data.duration || 0,
          channel: data.channel || data.uploader || 'Unknown',
          viewCount: data.view_count || 0,
          uploadDate: data.upload_date || null,
          description: (data.description || '').substring(0, 500),
        });
      } catch (parseErr) {
        logger.error('Failed to parse yt-dlp JSON', { error: parseErr.message });
        reject(new DownloadError('Failed to parse video information'));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      logger.error('yt-dlp spawn error', { error: err.message });

      if (err.code === 'ENOENT') {
        reject(new DownloadError('yt-dlp is not installed or not found in PATH'));
      } else {
        reject(new DownloadError(`yt-dlp error: ${err.message}`));
      }
    });
  });
}

/**
 * Download and convert audio using yt-dlp + FFmpeg.
 *
 * @param {object} options
 * @param {string} options.url - Validated YouTube URL
 * @param {string} options.format - Audio format (mp3, wav, flac, m4a)
 * @param {string} options.outputDir - Directory to save the file
 * @param {string} options.jobId - Unique job identifier
 * @param {function} options.onProgress - Progress callback ({ percent, speed, eta, status })
 * @param {AbortSignal} [options.signal] - Abort signal for cancellation
 * @returns {Promise<{filePath: string, filename: string, title: string}>}
 */
async function downloadAudio({ url, format, outputDir, jobId, onProgress, signal }) {
  const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
  const hasCookies = fs.existsSync(cookiesPath);

  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(outputDir, '%(title)s.%(ext)s');

    const args = [
      '-f', 'bestaudio',
      '-x',
      '--audio-format', format,
      '--no-playlist',
      '--newline',
      '--no-warnings',
      '--socket-timeout', '30',
      '--retries', '3',
      '--fragment-retries', '3',
      '--ffmpeg-location', config.ffmpegPath,
      '--no-colors',
      '--ignore-config',
      '--no-cache-dir',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
    ];

    if (hasCookies) {
      args.push('--cookies', cookiesPath);
    }

    args.push('-o', outputTemplate);
    args.push(url);

    // Best quality for MP3
    if (format === 'mp3') {
      args.push('--audio-quality', '0');
    }

    // Embed thumbnail for MP3/M4A
    if (format === 'mp3' || format === 'm4a') {
      args.push('--embed-thumbnail');
    }

    // Embed metadata
    args.push('--embed-metadata');

    args.push(url);

    logger.info(`[${jobId}] Starting download: ${format.toUpperCase()}`);
    logger.debug(`[${jobId}] Command: ${config.ytDlpPath} ${args.join(' ')}`);

    const proc = spawn(config.ytDlpPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    let lastProgress = -1;
    let downloadedFilePath = null;

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        proc.kill('SIGTERM');
        reject(new DownloadError('Download was cancelled'));
      }, { once: true });
    }

    // Timeout
    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new TimeoutError(`Download timed out after ${config.downloadTimeoutMs / 1000}s`));
    }, config.downloadTimeoutMs);

    // Parse stdout for progress
    let buffer = '';
    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || ''; // Keep the last incomplete line

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        logger.debug(`[${jobId}] yt-dlp: ${trimmedLine}`);

        // Progress line: [download]  45.2% of  5.23MiB at  1.23MiB/s ETA 00:04
        // More lenient regex to handle various yt-dlp versions and formats
        const progressMatch = trimmedLine.match(/\[download\]\s+([\d.]+)%\s+of\s+(?:~?[\d.]+\w+)\s+at\s+([\d.]+\w+\/s)\s+ETA\s+([\d:]+)/i) ||
                             trimmedLine.match(/\[download\]\s+([\d.]+)%/i);

        if (progressMatch) {
          const percent = parseFloat(progressMatch[1]);
          const speed = progressMatch[2] || null;
          const eta = progressMatch[3] || null;

          // Always send the first update (lastProgress is -1 initially)
          // or if the percentage has increased
          if (percent > lastProgress || lastProgress === -1) {
            lastProgress = percent;
            onProgress({
              percent: Math.min(percent, 95), // reserve 5% for conversion
              speed,
              eta,
              status: 'downloading',
            });
          }
          continue;
        }

        // Destination line: [download] Destination: /path/to/file.mp3
        if (trimmedLine.includes('Destination:')) {
          const destMatch = trimmedLine.match(/Destination:\s+(.+)/);
          if (destMatch) {
            const dest = destMatch[1].trim();
            if (dest.endsWith(`.${format}`)) {
              downloadedFilePath = dest;
            }
          }
          continue;
        }

        // ExtractAudio line: [ExtractAudio] Destination: /path/to/file.mp3
        if (trimmedLine.includes('[ExtractAudio]')) {
          const extractMatch = trimmedLine.match(/Destination:\s+(.+)/);
          if (extractMatch) {
            downloadedFilePath = extractMatch[1].trim();
          }
          onProgress({ percent: 97, status: 'converting' });
          continue;
        }

        // Merger/PostProcessor completion
        if (trimmedLine.includes('[Merger]') || trimmedLine.includes('[EmbedThumbnail]') || trimmedLine.includes('[Metadata]')) {
          onProgress({ percent: 98, status: 'converting' });
          continue;
        }

        // Already downloaded
        if (trimmedLine.includes('has already been downloaded')) {
          const alreadyMatch = trimmedLine.match(/\[download\]\s+(.+)\s+has already been downloaded/);
          if (alreadyMatch) {
            downloadedFilePath = alreadyMatch[1].trim();
          }
        }

        // Deleting original file (means conversion happened)
        if (trimmedLine.includes('Deleting original file')) {
          onProgress({ percent: 99, status: 'converting' });
        }
      }
    });

    proc.stderr.on('data', (chunk) => {
      const msg = chunk.toString().trim();
      if (msg) {
        stderr += msg + '\n';
        logger.debug(`[${jobId}] yt-dlp stderr: ${msg}`);
      }
    });

    proc.on('close', (code) => {
      clearTimeout(timer);

      if (code !== 0) {
        logger.error(`[${jobId}] yt-dlp failed`, { code, stderr: stderr.trim() });

        if (stderr.includes('Private video') || stderr.includes('Sign in')) {
          return reject(new DownloadError('This video is private or requires authentication'));
        }
        if (stderr.includes('unavailable') || stderr.includes('not available')) {
          return reject(new DownloadError('This video is unavailable'));
        }
        if (stderr.includes('copyright')) {
          return reject(new DownloadError('This video is blocked due to copyright'));
        }

        return reject(new DownloadError(
          `Download failed (exit code ${code}): ${stderr.trim().slice(0, 300)}`
        ));
      }

      // Find the output file if we didn't capture it from stdout
      if (!downloadedFilePath) {
        const fs = require('fs');
        try {
          const files = fs.readdirSync(outputDir);
          // Look for the file with the correct extension
          const audioFile = files.find((f) =>
            f.endsWith(`.${format}`)
          );
          if (audioFile) {
            downloadedFilePath = path.join(outputDir, audioFile);
          }
        } catch (err) {
          logger.warn(`[${jobId}] Failed to list output directory: ${err.message}`);
        }
      }

      if (!downloadedFilePath) {
        return reject(new DownloadError('Download completed but output file not found'));
      }

      const filename = path.basename(downloadedFilePath);
      logger.info(`[${jobId}] Download complete: ${filename}`);

      onProgress({ percent: 100, status: 'completed' });

      resolve({
        filePath: downloadedFilePath,
        filename: sanitizeFilename(path.basename(downloadedFilePath, path.extname(downloadedFilePath))) + path.extname(downloadedFilePath),
        title: path.basename(downloadedFilePath, path.extname(downloadedFilePath)),
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      logger.error(`[${jobId}] Spawn error`, { error: err.message });

      if (err.code === 'ENOENT') {
        reject(new DownloadError('yt-dlp is not installed or not found in PATH'));
      } else {
        reject(new DownloadError(`Process error: ${err.message}`));
      }
    });
  });
}

module.exports = {
  getVideoInfo,
  downloadAudio,
};
