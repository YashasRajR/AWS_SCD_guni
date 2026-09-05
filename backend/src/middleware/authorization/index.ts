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
