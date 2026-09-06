import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { schedulePdfController, schedulePdfUploadMiddleware } from './schedule-pdf.controller.js';

// Public — mounted at /api/v1/schedule-pdf.
export const schedulePdfRouter = Router();
schedulePdfRouter.get('/', asyncHandler(schedulePdfController.getStatus));
schedulePdfRouter.get('/download', asyncHandler(schedulePdfController.downloadPublished));

// Admin — mounted at /api/v1/admin/schedule-pdf.
export const schedulePdfAdminRouter = Router();

schedulePdfAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  asyncHandler(schedulePdfController.adminGetStatus),
);

schedulePdfAdminRouter.get(
  '/pdf',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  asyncHandler(schedulePdfController.adminDownload),
);

schedulePdfAdminRouter.post(
  '/generate',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  asyncHandler(schedulePdfController.generate),
);

schedulePdfAdminRouter.post(
  '/replace',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  schedulePdfUploadMiddleware,
  asyncHandler(schedulePdfController.replace),
);

schedulePdfAdminRouter.post(
  '/publish',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  asyncHandler(schedulePdfController.publish),
);

schedulePdfAdminRouter.post(
  '/unpublish',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  asyncHandler(schedulePdfController.unpublish),
);
