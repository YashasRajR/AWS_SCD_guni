import type { NextFunction, Request, Response } from 'express';
import { ERROR_CODES } from '@scd/constants';
import { AppError } from '../../utils/errors.js';
import { sendError } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';
import { getEnv } from '../../config/env.js';

/** 404 handler for any route that didn't match — placed after all routes. */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, {
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: `No route matches ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Central error handler. Known AppErrors map straight to their code/status;
 * anything else is logged server-side and returned as a generic
 * INTERNAL_ERROR — the raw message/stack is never sent to the client in
 * production, so accidental leaks (SQL errors etc.) don't reach callers.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const env = getEnv();

  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err }, 'Request failed with a server error');
    sendError(res, err.status, {
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled error');
  sendError(res, 500, {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'An unexpected error occurred. Please try again.',
    ...(env.NODE_ENV !== 'production' && err instanceof Error
      ? { details: { message: err.message } }
      : {}),
  });
}
