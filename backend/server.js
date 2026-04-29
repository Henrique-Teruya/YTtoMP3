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
const { exec, execSync } = require('child_process');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const convertRoutes = require('./routes/convert.routes');
const infoRoutes = require('./routes/info.routes');
const fileService = require('./services/file.service');
const queueService = require('./services/queue.service');

const app = express();

// ─── Security ────────────────────────────────────────────
// Loosened for local use
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

app.use(cors({ origin: '*' })); // Local dev is usually fine with open cors

// ─── Parsing & Compression ──────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' })); // Increased for local flexibility
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ─── Request Logging ────────────────────────────────────
app.use(morgan('dev'));

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
  const server = app.listen(config.port, () => {
    const url = `http://localhost:${config.port}`;
    logger.info('═══════════════════════════════════════════════');
    logger.info('  YTMP3 PRO — Local Version');
    logger.info(`  App running at: ${url}`);
    logger.info('═══════════════════════════════════════════════');
    
    // Background dependency check
    checkDependency('yt-dlp', config.ytDlpPath);
    checkDependency('ffmpeg', config.ffmpegPath);

    // Open browser automatically (only if NOT in Electron)
    if (process.env.IS_ELECTRON !== 'true') {
      openBrowser(url);
    }
  });

  // Ensure downloads directory exists
  fileService.ensureDownloadDir();
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

/**
 * Opens the default browser to the specified URL.
 */
function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${start} ${url}`, (err) => {
    if (err) logger.error('Failed to open browser:', err.message);
  });
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
