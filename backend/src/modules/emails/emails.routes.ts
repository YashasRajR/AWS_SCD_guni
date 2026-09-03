import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { paginationQuerySchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { emailsController } from './emails.controller.js';

/** Mounted at /api/v1/admin/emails — read-only visibility into the delivery queue for support/debugging. */
export const emailsAdminRouter = Router();
emailsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_REPORTS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(emailsController.list),
);
