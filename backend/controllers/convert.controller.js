/**
 * YTMP3 PRO — Convert Controller
 *
 * Handles conversion requests, SSE progress streaming, and file downloads.
 */

const path = require('path');
const fs = require('fs');
const queueService = require('../services/queue.service');
const ytdlpService = require('../services/ytdlp.service');
const fileService = require('../services/file.service');
const { validateUrl, validateFormat } = require('../utils/sanitizer');
const logger = require('../utils/logger');

/**
 * POST /api/convert
 * Start a new conversion job.
 */
async function startConversion(req, res, next) {
  try {
    const url = validateUrl(req.body.url);
    const format = validateFormat(req.body.format);

    // Create job
    const job = queueService.createJob(url, format);

    // Respond immediately with job ID
    res.status(202).json({
      status: 'queued',
      jobId: job.id,
      message: 'Conversion job queued',
    });

    // Process the queue
    processQueue();
  } catch (err) {
    next(err);
  }
}

/**
 * Process pending jobs in the queue.
 */
async function processQueue() {
  const job = queueService.dequeue();
  if (!job) return;

  try {
    // Create job directory
    const outputDir = fileService.createJobDir(job.id);

    // Mark as active
    queueService.markActive(job.id);

    // Fetch video info first (for thumbnail/title)
    try {
      const info = await ytdlpService.getVideoInfo(job.url);
      queueService.updateJob(job.id, {
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        channel: info.channel,
      });
    } catch (infoErr) {
      logger.warn(`[${job.id}] Could not fetch video info: ${infoErr.message}`);
      // Don't fail the job — continue with download
    }

    // Download audio
    const result = await ytdlpService.downloadAudio({
      url: job.url,
      format: job.format,
      outputDir,
      jobId: job.id,
      signal: job.abortController?.signal,
      onProgress: (progress) => {
        queueService.updateJob(job.id, {
          progress: progress.percent,
          speed: progress.speed || null,
          eta: progress.eta || null,
          status: progress.status || 'downloading',
        });
      },
    });

    queueService.markCompleted(job.id, result);
  } catch (err) {
    queueService.markFailed(job.id, err.message);
  } finally {
    // Try to process next job
    processQueue();
  }
}

/**
 * GET /api/convert/:jobId/status
 * Server-Sent Events endpoint for real-time progress.
 */
function streamStatus(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = queueService.getJob(jobId);

    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job not found' });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial state
    const sendEvent = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Register listener
    queueService.addListener(jobId, sendEvent);

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15_000);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      queueService.removeListener(jobId, sendEvent);
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/convert/:jobId/download
 * Serve the completed audio file.
 */
function downloadFile(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = queueService.getJob(jobId);

    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job not found' });
    }

    if (job.status !== 'completed' || !job.filePath) {
      return res.status(400).json({
        status: 'error',
        message: 'File is not ready for download',
      });
    }

    // Verify path is safe
    const safePath = fileService.safePath(job.filePath);
    if (!safePath) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    // Check file exists
    if (!fs.existsSync(safePath)) {
      return res.status(410).json({
        status: 'error',
        message: 'File has expired and been removed',
      });
    }

    const fileInfo = fileService.getFileInfo(safePath);
    const contentTypes = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      m4a: 'audio/mp4',
    };

    const ext = path.extname(safePath).slice(1).toLowerCase();
    const contentType = contentTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(job.filename || fileInfo.name)}"`);
    res.setHeader('Content-Length', fileInfo.size);

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);

    stream.on('error', (err) => {
      logger.error(`[${jobId}] File stream error`, { error: err.message });
      if (!res.headersSent) {
        res.status(500).json({ status: 'error', message: 'File read error' });
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/convert/:jobId
 * Cancel a job.
 */
function cancelJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const cancelled = queueService.cancelJob(jobId);

    if (!cancelled) {
      return res.status(400).json({
        status: 'error',
        message: 'Job cannot be cancelled (not found or already finished)',
      });
    }

    res.json({ status: 'ok', message: 'Job cancelled' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/convert/stats
 * Queue statistics.
 */
function getStats(req, res) {
  res.json({
    status: 'ok',
    data: queueService.getStats(),
  });
}

module.exports = {
  startConversion,
  streamStatus,
  downloadFile,
  cancelJob,
  getStats,
};
