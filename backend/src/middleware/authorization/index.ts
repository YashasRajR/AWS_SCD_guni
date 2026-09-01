import type { NextFunction, Request, Response } from 'express';
import type { RoleName } from '@scd/types';
import { hasAnyRole, hasAllPermissions } from '@scd/auth';
import { AppError } from '../../utils/errors.js';

/** Requires `authenticate` to have run first. */
export function requireRole(...roles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.identity) throw AppError.authRequired();
    if (!hasAnyRole(req.identity, roles)) throw AppError.forbidden();
    next();
  };
}

/** Requires `authenticate` to have run first. */
export function requirePermission(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.identity) throw AppError.authRequired();
    if (!hasAllPermissions(req.identity, permissions)) throw AppError.forbidden();
    next();
  };
}

/**
 * Ensures the authenticated identity's own attendee record is the one
 * being accessed, for /me-style ownership. Route handlers that resolve
 * "my" resources should derive the id from `req.identity.userId` directly
 * rather than trusting a client-supplied id — this guard is a defense in
 * depth for any route that also accepts an :id param.
 */
export function requireOwnUserId(paramName = 'userId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.identity) throw AppError.authRequired();
    const paramValue = req.params[paramName];
    if (paramValue && paramValue !== req.identity.userId) {
      throw AppError.forbidden("You cannot access another user's data.");
    }
    next();
  };
}
