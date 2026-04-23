/**
 * YTMP3 PRO — File Service
 *
 * Manages the downloads directory, temp files, and file serving.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Ensure the downloads directory exists.
 */
function ensureDownloadDir() {
  if (!fs.existsSync(config.downloadDir)) {
    fs.mkdirSync(config.downloadDir, { recursive: true });
    logger.info(`Created downloads directory: ${config.downloadDir}`);
  }
}

/**
 * Create a unique job directory inside downloads.
 * @param {string} jobId
 * @returns {string} Absolute path to the job directory
 */
function createJobDir(jobId) {
  const dir = path.join(config.downloadDir, jobId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Get file info (size, name).
 * @param {string} filePath
 * @returns {{ size: number, name: string } | null}
 */
function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      name: path.basename(filePath),
    };
  } catch {
    return null;
  }
}

/**
 * Remove a job directory and all its contents.
 * @param {string} jobId
 */
function removeJobDir(jobId) {
  const dir = path.join(config.downloadDir, jobId);
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      logger.debug(`Removed job directory: ${jobId}`);
    }
  } catch (err) {
    logger.warn(`Failed to remove job directory: ${jobId}`, { error: err.message });
  }
}

/**
 * Resolve a file path and verify it's within the downloads directory.
 * Prevents directory traversal attacks.
 * @param {string} filePath
 * @returns {string|null} Safe resolved path or null if unsafe
 */
function safePath(filePath) {
  const resolved = path.resolve(filePath);
  const downloadsResolved = path.resolve(config.downloadDir);

  if (!resolved.startsWith(downloadsResolved)) {
    logger.warn('Directory traversal attempt blocked', { filePath, resolved });
    return null;
  }

  return resolved;
}

module.exports = {
  ensureDownloadDir,
  createJobDir,
  getFileInfo,
  removeJobDir,
  safePath,
};
