import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  paginationQuerySchema,
  roleNameSchema,
  userIdParamSchema,
  userIdAndRoleParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { usersController } from './users.controller.js';

// Admin — mounted at /api/v1/admin/users. Every route here requires
// MANAGE_ROLES, which only SUPER_ADMIN is granted by default — role and
// privilege management is deliberately not something ADMIN can reach.
export const usersAdminRouter = Router();

usersAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(usersController.adminList),
);

usersAdminRouter.post(
  '/:userId/roles',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  validate(userIdParamSchema, 'params'),
  validate(roleNameSchema),
  asyncHandler(usersController.assignRole),
);

usersAdminRouter.delete(
  '/:userId/roles/:role',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ROLES),
  validate(userIdAndRoleParamSchema, 'params'),
  asyncHandler(usersController.revokeRole),
);
