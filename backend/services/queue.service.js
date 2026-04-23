/**
 * YTMP3 PRO — Job Queue Service
 *
 * In-memory job queue with concurrency control, status tracking,
 * and automatic cleanup of expired jobs.
 */

const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

/** @typedef {'queued'|'downloading'|'converting'|'completed'|'error'|'cancelled'} JobStatus */

/**
 * @typedef {object} Job
 * @property {string} id
 * @property {string} url
 * @property {string} format
 * @property {JobStatus} status
 * @property {number} progress
 * @property {string|null} speed
 * @property {string|null} eta
 * @property {string|null} filePath
 * @property {string|null} filename
 * @property {string|null} title
 * @property {string|null} thumbnail
 * @property {number|null} duration
 * @property {string|null} channel
 * @property {string|null} error
 * @property {number} createdAt
 * @property {number|null} completedAt
 * @property {AbortController|null} abortController
 * @property {Set<function>} listeners - SSE listeners
 */

class QueueService {
  constructor() {
    /** @type {Map<string, Job>} */
    this.jobs = new Map();

    /** @type {string[]} */
    this.pending = [];

    /** @type {number} */
    this.activeCount = 0;

    /** @type {Array<{id:string, title:string, format:string, completedAt:number}>} */
    this.history = [];

    // Periodic cleanup
    this._cleanupInterval = setInterval(
      () => this._cleanup(),
      60_000, // every minute
    );
  }

  /**
   * Create a new job and add it to the queue.
   * @param {string} url
   * @param {string} format
   * @returns {Job}
   */
  createJob(url, format) {
    const id = uuidv4();

    /** @type {Job} */
    const job = {
      id,
      url,
      format,
      status: 'queued',
      progress: 0,
      speed: null,
      eta: null,
      filePath: null,
      filename: null,
      title: null,
      thumbnail: null,
      duration: null,
      channel: null,
      error: null,
      createdAt: Date.now(),
      completedAt: null,
      abortController: new AbortController(),
      listeners: new Set(),
    };

    this.jobs.set(id, job);
    this.pending.push(id);

    logger.info(`[${id}] Job created: ${format.toUpperCase()} — ${url}`);
    return job;
  }

  /**
   * Get a job by ID.
   * @param {string} id
   * @returns {Job|undefined}
   */
  getJob(id) {
    return this.jobs.get(id);
  }

  /**
   * Update job fields and notify all SSE listeners.
   * @param {string} id
   * @param {Partial<Job>} updates
   */
  updateJob(id, updates) {
    const job = this.jobs.get(id);
    if (!job) return;

    Object.assign(job, updates);

    // Notify listeners
    const event = this._serializeJob(job);
    for (const listener of job.listeners) {
      try {
        listener(event);
      } catch {
        job.listeners.delete(listener);
      }
    }
  }

  /**
   * Add an SSE listener to a job.
   * @param {string} id
   * @param {function} listener
   */
  addListener(id, listener) {
    const job = this.jobs.get(id);
    if (job) {
      job.listeners.add(listener);

      // Send current state immediately
      listener(this._serializeJob(job));
    }
  }

  /**
   * Remove an SSE listener from a job.
   * @param {string} id
   * @param {function} listener
   */
  removeListener(id, listener) {
    const job = this.jobs.get(id);
    if (job) {
      job.listeners.delete(listener);
    }
  }

  /**
   * Cancel a job.
   * @param {string} id
   * @returns {boolean}
   */
  cancelJob(id) {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.status === 'completed' || job.status === 'error' || job.status === 'cancelled') {
      return false;
    }

    job.abortController?.abort();
    this.updateJob(id, { status: 'cancelled', error: 'Cancelled by user' });

    // Remove from pending if still queued
    this.pending = this.pending.filter((pid) => pid !== id);

    logger.info(`[${id}] Job cancelled`);
    return true;
  }

  /**
   * Check if more jobs can be started, and dequeue if so.
   * @returns {Job|null} The next job to process, or null
   */
  dequeue() {
    if (this.activeCount >= config.maxConcurrentDownloads) return null;
    if (this.pending.length === 0) return null;

    const id = this.pending.shift();
    const job = this.jobs.get(id);

    if (!job || job.status !== 'queued') {
      return this.dequeue(); // skip invalid, try next
    }

    this.activeCount++;
    return job;
  }

  /**
   * Mark a job as started (downloading).
   * @param {string} id
   */
  markActive(id) {
    this.updateJob(id, { status: 'downloading', progress: 0 });
  }

  /**
   * Mark a job as completed.
   * @param {string} id
   * @param {{filePath:string, filename:string, title:string}} result
   */
  markCompleted(id, result) {
    this.activeCount = Math.max(0, this.activeCount - 1);
    this.updateJob(id, {
      status: 'completed',
      progress: 100,
      filePath: result.filePath,
      filename: result.filename,
      title: result.title,
      completedAt: Date.now(),
    });

    // Add to history
    const job = this.jobs.get(id);
    if (job) {
      this.history.unshift({
        id: job.id,
        title: job.title,
        format: job.format,
        completedAt: job.completedAt,
      });
      // Keep last 50
      if (this.history.length > 50) this.history.pop();
    }

    logger.info(`[${id}] Job completed: ${result.filename}`);
  }

  /**
   * Mark a job as failed.
   * @param {string} id
   * @param {string} errorMessage
   */
  markFailed(id, errorMessage) {
    this.activeCount = Math.max(0, this.activeCount - 1);
    this.updateJob(id, {
      status: 'error',
      error: errorMessage,
      completedAt: Date.now(),
    });

    logger.error(`[${id}] Job failed: ${errorMessage}`);
  }

  /**
   * Get queue stats.
   * @returns {object}
   */
  getStats() {
    return {
      total: this.jobs.size,
      pending: this.pending.length,
      active: this.activeCount,
      maxConcurrent: config.maxConcurrentDownloads,
    };
  }

  /**
   * Serialize a job for SSE transmission (exclude internal fields).
   * @param {Job} job
   * @returns {object}
   */
  _serializeJob(job) {
    return {
      id: job.id,
      url: job.url,
      format: job.format,
      status: job.status,
      progress: job.progress,
      speed: job.speed,
      eta: job.eta,
      filename: job.filename,
      title: job.title,
      thumbnail: job.thumbnail,
      duration: job.duration,
      channel: job.channel,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }

  /**
   * Remove expired jobs and their files.
   */
  _cleanup() {
    const now = Date.now();
    const maxAge = config.fileRetentionMinutes * 60 * 1000;

    for (const [id, job] of this.jobs) {
      if (
        job.completedAt &&
        now - job.completedAt > maxAge &&
        (job.status === 'completed' || job.status === 'error' || job.status === 'cancelled')
      ) {
        // Clean up files
        if (job.filePath) {
          const fs = require('fs');
          const dir = require('path').dirname(job.filePath);
          try {
            fs.rmSync(dir, { recursive: true, force: true });
          } catch {
            // ignore
          }
        }

        job.listeners.clear();
        this.jobs.delete(id);
        logger.debug(`[${id}] Job cleaned up (expired)`);
      }
    }
  }

  /**
   * Shut down the queue (clear interval).
   */
  shutdown() {
    clearInterval(this._cleanupInterval);
  }
}

// Singleton
const queueService = new QueueService();

module.exports = queueService;
