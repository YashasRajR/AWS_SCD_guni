import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { paginationQuerySchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { paymentsController } from './payments.controller.js';

/** Mounted at /api/v1/payments. `/webhook` is public (called by the payment provider); `/initiate` is attendee-owned. */
export const paymentsPublicRouter = Router();
paymentsPublicRouter.post('/webhook', asyncHandler(paymentsController.webhook));
paymentsPublicRouter.post('/initiate', authenticate, asyncHandler(paymentsController.initiate));

/** Mounted at /api/v1/admin/payments. The attendee-owned "my payment" surface lives at /payments/initiate + user-dashboard. */
export const paymentsAdminRouter = Router();
paymentsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(paymentsController.list),
);
