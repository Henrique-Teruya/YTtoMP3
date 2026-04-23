/**
 * YTMP3 PRO — Rate Limiter Middleware
 *
 * Tiered rate limiting: general API, convert endpoint (strict), info endpoint.
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

/** General API rate limiter */
const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxGeneral,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests. Please try again later.',
  },
});

/** Convert endpoint — stricter limit */
const convertLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxConvert,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many conversion requests. Please wait before trying again.',
  },
});

/** Info endpoint — moderate limit */
const infoLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxInfo,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many info requests. Please wait before trying again.',
  },
});

module.exports = {
  generalLimiter,
  convertLimiter,
  infoLimiter,
};
