import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createPastEventSchema,
  updatePastEventSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { pastEventsController } from './past-events.controller.js';

// Public — mounted at /api/v1/past-events.
export const pastEventsRouter = Router();
pastEventsRouter.get('/', asyncHandler(pastEventsController.list));

// Admin — mounted at /api/v1/admin/content/past-events.
export const pastEventsAdminRouter = Router();

pastEventsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(pastEventsController.adminList),
);

pastEventsAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(createPastEventSchema),
  asyncHandler(pastEventsController.create),
);

pastEventsAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  validate(updatePastEventSchema),
  asyncHandler(pastEventsController.update),
);

pastEventsAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(pastEventsController.remove),
);
