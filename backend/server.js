/**
 * YTMP3 PRO — Express Server
 *
 * Main application entry point.
 * Mounts middleware, routes, and handles graceful shutdown.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { execSync } = require('child_process');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const convertRoutes = require('./routes/convert.routes');
const infoRoutes = require('./routes/info.routes');
const fileService = require('./services/file.service');
const queueService = require('./services/queue.service');

const app = express();

// ─── Security ────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://api.fontshare.com", "https://cdn.fontshare.com"],
      fontSrc: ["'self'", "https://cdn.fontshare.com"],
      imgSrc: ["'self'", "data:", "https://i.ytimg.com", "https://img.youtube.com", "https://*.ggpht.com"],
      connectSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({ origin: config.corsOrigin }));

// ─── Parsing & Compression ──────────────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ─── Request Logging ────────────────────────────────────
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Rate Limiting ──────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Static Frontend ────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── API Routes ─────────────────────────────────────────
app.use('/api/convert', convertRoutes);
app.use('/api/info', infoRoutes);

// ─── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    queue: queueService.getStats(),
  });
});

// ─── SPA Fallback ───────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ─── Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ─── Startup ────────────────────────────────────────────
async function start() {
  // Ensure downloads directory exists
  fileService.ensureDownloadDir();

  // Check external dependencies
  checkDependency('yt-dlp', config.ytDlpPath);
  checkDependency('ffmpeg', config.ffmpegPath);

  app.listen(config.port, () => {
    logger.info('═══════════════════════════════════════════════');
    logger.info('  YTMP3 PRO — Server Running');
    logger.info(`  Port:        ${config.port}`);
    logger.info(`  Environment: ${config.nodeEnv}`);
    logger.info(`  Frontend:    http://localhost:${config.port}`);
    logger.info(`  API:         http://localhost:${config.port}/api`);
    logger.info('═══════════════════════════════════════════════');
  });
}

/**
 * Verify an external tool is available.
 */
function checkDependency(name, cmd) {
  try {
    const version = execSync(`${cmd} --version`, { stdio: 'pipe' }).toString().trim().split('\n')[0];
    logger.info(`✓ ${name} found: ${version}`);
  } catch {
    logger.warn(`✗ ${name} not found at "${cmd}". Install it or set the path in .env`);
  }
}

// ─── Graceful Shutdown ──────────────────────────────────
function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  queueService.shutdown();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

// Start
start();

module.exports = app;
