import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { reportsController } from './reports.controller.js';

// Mounted at /api/v1/admin/dashboard.
export const reportsRouter = Router();

reportsRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_REPORTS),
  asyncHandler(reportsController.getDashboard),
);
