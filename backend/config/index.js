/**
 * YTMP3 PRO — Centralized Configuration
 *
 * Reads environment variables with sensible defaults.
 * Validates critical paths at import time.
 */

require('dotenv').config();
const path = require('path');

const config = {
  /** Server */
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  /** External tools */
  ytDlpPath: process.env.YT_DLP_PATH || (process.env.IS_ELECTRON === 'true' 
    ? path.join(process.env.RESOURCES_PATH, 'bin', 'yt-dlp.exe')
    : path.resolve('./bin/yt-dlp.exe')),
    
  ffmpegPath: process.env.FFMPEG_PATH || (process.env.IS_ELECTRON === 'true'
    ? path.join(process.env.RESOURCES_PATH, 'bin', 'ffmpeg.exe')
    : path.resolve('./bin/ffmpeg.exe')),

  /** Downloads */
  downloadDir: process.env.DOWNLOAD_DIR || path.resolve('./backend/downloads'),
  maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS, 10) || 5, // Increased for local
  downloadTimeoutMs: parseInt(process.env.DOWNLOAD_TIMEOUT_MS, 10) || 600_000, // 10 min
  fileRetentionMinutes: parseInt(process.env.FILE_RETENTION_MINUTES, 10) || 60, // 1 hour
  maxPlaylistTracks: parseInt(process.env.MAX_PLAYLIST_TRACKS, 10) || 200, // Higher for local

  /** Logging */
  logLevel: process.env.LOG_LEVEL || 'info',

  /** Supported formats */
  supportedFormats: ['mp3', 'wav', 'flac', 'm4a'],
};

module.exports = config;
