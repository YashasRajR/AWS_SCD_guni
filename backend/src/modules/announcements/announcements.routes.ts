import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { announcementsController } from './announcements.controller.js';

// Public — mounted at /api/v1/announcements.
export const announcementsRouter = Router();

announcementsRouter.get('/', asyncHandler(announcementsController.list));

// Admin — mounted at /api/v1/admin/content/announcements.
export const announcementsAdminRouter = Router();

announcementsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ANNOUNCEMENTS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(announcementsController.adminList),
);

announcementsAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ANNOUNCEMENTS),
  validate(createAnnouncementSchema),
  asyncHandler(announcementsController.create),
);

announcementsAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ANNOUNCEMENTS),
  validate(uuidParamSchema, 'params'),
  validate(updateAnnouncementSchema),
  asyncHandler(announcementsController.update),
);

announcementsAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ANNOUNCEMENTS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(announcementsController.remove),
);
