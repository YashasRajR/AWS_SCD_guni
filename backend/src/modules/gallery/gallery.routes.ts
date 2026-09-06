import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createGalleryItemSchema,
  updateGalleryItemSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { galleryController } from './gallery.controller.js';

// Public — mounted at /api/v1/gallery.
export const galleryRouter = Router();
galleryRouter.get('/', asyncHandler(galleryController.list));

// Admin — mounted at /api/v1/admin/content/gallery. Reuses MANAGE_SETTINGS,
// same as the other smaller CMS modules (uploads/site-links/etc).
export const galleryAdminRouter = Router();

galleryAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(galleryController.adminList),
);

galleryAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(createGalleryItemSchema),
  asyncHandler(galleryController.create),
);

galleryAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  validate(updateGalleryItemSchema),
  asyncHandler(galleryController.update),
);

galleryAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(galleryController.remove),
);
