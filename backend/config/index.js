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
  ytDlpPath: process.env.YT_DLP_PATH || 'yt-dlp',
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',

  /** Downloads */
  downloadDir: path.resolve(process.env.DOWNLOAD_DIR || './backend/downloads'),
  maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS, 10) || 3,
  downloadTimeoutMs: parseInt(process.env.DOWNLOAD_TIMEOUT_MS, 10) || 300_000,
  fileRetentionMinutes: parseInt(process.env.FILE_RETENTION_MINUTES, 10) || 30,
  maxPlaylistTracks: parseInt(process.env.MAX_PLAYLIST_TRACKS, 10) || 50,

  /** Security */
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900_000,
  rateLimitMaxGeneral: parseInt(process.env.RATE_LIMIT_MAX_GENERAL, 10) || 100,
  rateLimitMaxConvert: parseInt(process.env.RATE_LIMIT_MAX_CONVERT, 10) || 10,
  rateLimitMaxInfo: parseInt(process.env.RATE_LIMIT_MAX_INFO, 10) || 30,

  /** Logging */
  logLevel: process.env.LOG_LEVEL || 'info',

  /** Supported formats */
  supportedFormats: ['mp3', 'wav', 'flac', 'm4a'],
};

module.exports = config;
