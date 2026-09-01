import rateLimit from 'express-rate-limit';
import { ERROR_CODES } from '@scd/constants';
import { getEnv } from '../../config/env.js';

/** General API rate limiter. Auth routes get a stricter one below. */
export function createApiRateLimiter() {
  const env = getEnv();
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: { code: ERROR_CODES.RATE_LIMITED, message: 'Too many requests. Please slow down.' },
      });
    },
  });
}

/** Tighter limiter for login/register/forgot-password to blunt brute force. */
export function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: 'Too many authentication attempts. Please try again later.',
        },
      });
    },
  });
}
