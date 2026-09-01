import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createSessionSchema,
  updateSessionSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sessionsController } from './sessions.controller.js';

// Public — mounted at /api/v1/sessions.
export const sessionsRouter = Router();

sessionsRouter.get('/', asyncHandler(sessionsController.list));
sessionsRouter.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(sessionsController.getById),
);

// Admin — mounted at /api/v1/admin/content/sessions.
export const sessionsAdminRouter = Router();

sessionsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SESSIONS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(sessionsController.adminList),
);

sessionsAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SESSIONS),
  validate(createSessionSchema),
  asyncHandler(sessionsController.create),
);

sessionsAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SESSIONS),
  validate(uuidParamSchema, 'params'),
  validate(updateSessionSchema),
  asyncHandler(sessionsController.update),
);

sessionsAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SESSIONS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(sessionsController.remove),
);
