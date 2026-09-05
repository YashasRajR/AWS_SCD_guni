import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { usersRepository } from '../../modules/users/users.repository.js';
import type { AccessTokenPayload } from '../../modules/auth/auth.types.js';

/**
 * Verifies the Bearer token AND re-checks the account's current status in
 * the database on every request — deliberately not relying solely on the
 * JWT payload. Roles/permissions themselves are still trusted from the
 * token (re-read fresh on every login/refresh; a role change since the
 * last refresh takes effect within one AUTH_TOKEN_TTL window, an accepted
 * bounded tradeoff — see docs/architecture/authentication.md), but
 * *account status* is not: an admin suspending/deactivating a user must
 * take effect immediately, not just once that user's current access token
 * happens to expire. This is one extra indexed primary-key lookup
 * (users.id) per authenticated request.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.authRequired();
    }
    const token = header.slice('Bearer '.length).trim();

    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(token, getEnv().AUTH_SECRET, { algorithms: ['HS256'] }) as AccessTokenPayload;
    } catch {
      throw AppError.authRequired('Your session has expired or is invalid. Please log in again.');
    }

    const user = await usersRepository.findById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw AppError.authRequired('Your session is no longer valid. Please log in again.');
    }

    req.identity = {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Like `authenticate`, but does not fail the request when no/invalid token
 * (or a no-longer-ACTIVE account) is present — useful for public endpoints
 * that vary slightly for a logged-in caller. Currently unused by any route
 * but kept available.
 */
export async function authenticateOptional(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(header.slice(7).trim(), getEnv().AUTH_SECRET, { algorithms: ['HS256'] }) as AccessTokenPayload;
    const user = await usersRepository.findById(payload.sub);
    if (user && user.status === 'ACTIVE') {
      req.identity = {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
      };
    }
  } catch {
    // Ignore — treat as anonymous.
  }
  next();
}
