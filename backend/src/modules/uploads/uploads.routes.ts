import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { uploadMiddleware, uploadsController } from './uploads.controller.js';

export const uploadsAdminRouter = Router();

// Reuses MANAGE_SETTINGS as the generic "can manage CMS content" gate,
// same as ticket-plans/coupons -- uploads aren't tied to one content type.
uploadsAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  uploadMiddleware,
  asyncHandler(uploadsController.upload),
);
