import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { paginationQuerySchema, uuidParamSchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { invoicesController } from './invoices.controller.js';

export const invoicesAdminRouter = Router();

invoicesAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(invoicesController.list),
);

invoicesAdminRouter.get(
  '/:id/pdf',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(invoicesController.getPdf),
);

invoicesAdminRouter.post(
  '/:id/resend-email',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(invoicesController.resendEmail),
);
