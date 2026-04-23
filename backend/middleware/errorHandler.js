/**
 * YTMP3 PRO — Global Error Handler Middleware
 *
 * Catches all errors thrown by controllers/services and returns
 * structured JSON responses.
 */

const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Express error-handling middleware (4 arguments).
 */
function errorHandler(err, req, res, _next) {
  // Operational errors (expected)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  // Unexpected errors
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(500).json({
    status: 'error',
    message,
  });
}

module.exports = errorHandler;
