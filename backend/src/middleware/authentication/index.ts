import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import type { AccessTokenPayload } from '../../modules/auth/auth.types.js';

/**
 * Verifies the Bearer token on the request and attaches `req.identity`.
 * Roles/permissions are embedded in the access token at login time (see
 * modules/auth/auth.service.ts) rather than re-queried on every request —
 * acceptable given the short access-token TTL; a role/permission change
 * takes effect the next time the user logs in or refreshes their token.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.authRequired();
  }
  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, getEnv().AUTH_SECRET) as AccessTokenPayload;
    req.identity = {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };
    next();
  } catch {
    throw AppError.authRequired('Your session has expired or is invalid. Please log in again.');
  }
}

/**
 * Like `authenticate`, but does not fail the request when no/invalid token
 * is present — useful for public endpoints that vary slightly for a
 * logged-in caller. Currently unused by any route but kept available.
 */
export function authenticateOptional(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(header.slice(7).trim(), getEnv().AUTH_SECRET) as AccessTokenPayload;
    req.identity = {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  } catch {
    // Ignore — treat as anonymous.
  }
  next();
}
