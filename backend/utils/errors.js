/**
 * YTMP3 PRO — Custom Error Hierarchy
 *
 * Operational errors extend AppError and carry an HTTP status code.
 * The global error handler maps these to structured API responses.
 */

class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {boolean} isOperational
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  /**
   * @param {string} message
   * @param {Array<{field:string, message:string}>} [errors]
   */
  constructor(message, errors) {
    super(message, 400);
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class TimeoutError extends AppError {
  constructor(message = 'Operation timed out') {
    super(message, 408);
  }
}

class DownloadError extends AppError {
  constructor(message = 'Download failed') {
    super(message, 502);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  TimeoutError,
  DownloadError,
  ConflictError,
};
