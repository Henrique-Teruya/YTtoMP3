/**
 * YTMP3 PRO — Input Validation & Sanitization
 *
 * All user-facing inputs are validated here before reaching services.
 * Prevents command injection, directory traversal, and malformed data.
 */

const config = require('../config');
const { ValidationError } = require('./errors');

/** YouTube URL patterns */
const YT_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
  /^https?:\/\/youtu\.be\/[\w-]{11}/,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]{11}/,
  /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=[\w-]+/,
  /^https?:\/\/music\.youtube\.com\/watch\?v=[\w-]{11}/,
];

/**
 * Validate a YouTube URL.
 * @param {string} url
 * @returns {string} Sanitized URL
 * @throws {ValidationError}
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL is required');
  }

  const trimmed = url.trim();

  if (trimmed.length > 2048) {
    throw new ValidationError('URL is too long');
  }

  // Prevent command injection via shell metacharacters
  const dangerous = /[;&|`$(){}[\]!#]/;
  if (dangerous.test(trimmed)) {
    throw new ValidationError('URL contains invalid characters');
  }

  const isValid = YT_PATTERNS.some((pattern) => pattern.test(trimmed));
  if (!isValid) {
    throw new ValidationError(
      'Invalid YouTube URL. Supported formats: youtube.com/watch, youtu.be, youtube.com/shorts, youtube.com/playlist'
    );
  }

  return trimmed;
}

/**
 * Validate the requested audio format.
 * @param {string} format
 * @returns {string} Validated format in lowercase
 * @throws {ValidationError}
 */
function validateFormat(format) {
  if (!format || typeof format !== 'string') {
    return 'mp3'; // default
  }

  const normalized = format.trim().toLowerCase();

  if (!config.supportedFormats.includes(normalized)) {
    throw new ValidationError(
      `Unsupported format "${format}". Supported: ${config.supportedFormats.join(', ')}`
    );
  }

  return normalized;
}

/**
 * Sanitize a filename — strip unsafe characters, limit length.
 * @param {string} name
 * @returns {string}
 */
function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return 'audio';

  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')   // strip unsafe chars
    .replace(/\s+/g, ' ')                      // collapse whitespace
    .trim()
    .substring(0, 200)                         // limit length
    || 'audio';
}

/**
 * Check if a URL is a playlist.
 * @param {string} url
 * @returns {boolean}
 */
function isPlaylistUrl(url) {
  return /youtube\.com\/playlist\?list=/.test(url);
}

module.exports = {
  validateUrl,
  validateFormat,
  sanitizeFilename,
  isPlaylistUrl,
};
