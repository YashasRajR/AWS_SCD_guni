import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { updateSocialPostSettingsSchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { socialPostSettingsController } from './social-post-settings.controller.js';

// Admin — mounted at /api/v1/admin/content/social-post-settings. Reuses
// MANAGE_SETTINGS, same as event config and ticket plans.
export const socialPostSettingsAdminRouter = Router();

socialPostSettingsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  asyncHandler(socialPostSettingsController.get),
);

socialPostSettingsAdminRouter.patch(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(updateSocialPostSettingsSchema),
  asyncHandler(socialPostSettingsController.update),
);
