import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { systemStatusController } from './system-status.controller.js';

// Mounted at /api/v1/admin/system-status.
export const systemStatusRouter = Router();

systemStatusRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_REPORTS),
  asyncHandler(systemStatusController.get),
);
