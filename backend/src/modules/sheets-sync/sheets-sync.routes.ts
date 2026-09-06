import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sheetsSyncController } from './sheets-sync.controller.js';

// Mounted at /api/v1/admin/sheets-sync — a reconciliation view of the
// sync queue (which registrations have synced, which are stuck retrying).
export const sheetsSyncAdminRouter = Router();

sheetsSyncAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_REPORTS),
  asyncHandler(sheetsSyncController.list),
);
