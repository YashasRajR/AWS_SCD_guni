import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createTimelineItemSchema,
  updateTimelineItemSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { timelineController } from './timeline.controller.js';

// Public — mounted at /api/v1/timeline.
export const timelineRouter = Router();

timelineRouter.get('/', asyncHandler(timelineController.list));

// Admin — mounted at /api/v1/admin/content/timeline.
export const timelineAdminRouter = Router();

timelineAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_TIMELINE),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(timelineController.adminList),
);

timelineAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_TIMELINE),
  validate(createTimelineItemSchema),
  asyncHandler(timelineController.create),
);

timelineAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_TIMELINE),
  validate(uuidParamSchema, 'params'),
  validate(updateTimelineItemSchema),
  asyncHandler(timelineController.update),
);

timelineAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_TIMELINE),
  validate(uuidParamSchema, 'params'),
  asyncHandler(timelineController.remove),
);
