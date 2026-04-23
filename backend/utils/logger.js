/**
 * YTMP3 PRO — Structured Logger
 *
 * Color-coded, timestamped console logging with level filtering.
 * In production, this could be swapped for pino/winston with no API change.
 */

const config = require('../config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const COLORS = {
  error: '\x1b[31m',   // red
  warn:  '\x1b[33m',   // yellow
  info:  '\x1b[36m',   // cyan
  debug: '\x1b[90m',   // gray
};
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

const currentLevel = LEVELS[config.logLevel] ?? LEVELS.info;

/**
 * Format a log line with timestamp, level badge, and message.
 * @param {'error'|'warn'|'info'|'debug'} level
 * @param {string} message
 * @param {object} [meta]
 */
function log(level, message, meta) {
  if (LEVELS[level] > currentLevel) return;

  const timestamp = new Date().toISOString();
  const color = COLORS[level];
  const tag = level.toUpperCase().padEnd(5);

  let line = `${BOLD}${color}[${tag}]${RESET} ${color}${timestamp}${RESET}  ${message}`;

  if (meta) {
    const serialized = typeof meta === 'object'
      ? JSON.stringify(meta, null, 2)
      : String(meta);
    line += `\n       ${color}${serialized}${RESET}`;
  }

  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

module.exports = logger;
