import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createEventSchema,
  updateEventSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { eventController } from './event.controller.js';

// Public — mounted at /api/v1/event.
export const eventRouter = Router();

eventRouter.get('/', asyncHandler(eventController.getCurrent));

// Admin — mounted at /api/v1/admin/content/event. Sees/manages every
// status, not just PUBLISHED.
export const eventAdminRouter = Router();

eventAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(eventController.list),
);

eventAdminRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(eventController.getById),
);

eventAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(createEventSchema),
  asyncHandler(eventController.create),
);

eventAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  validate(updateEventSchema),
  asyncHandler(eventController.update),
);

eventAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(eventController.remove),
);
