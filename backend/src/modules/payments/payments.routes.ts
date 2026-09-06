import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  paymentsListQuerySchema,
  refundPaymentSchema,
  reconcilePaymentSchema,
  uuidParamSchema,
} from '@scd/validation';
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
  '/export',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  asyncHandler(paymentsController.exportCsv),
);

paymentsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(paymentsListQuerySchema, 'query'),
  asyncHandler(paymentsController.list),
);

paymentsAdminRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(paymentsController.getDetail),
);

paymentsAdminRouter.get(
  '/:id/gateway-status',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(paymentsController.gatewayStatus),
);

paymentsAdminRouter.post(
  '/:id/retry-verification',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(paymentsController.retryVerification),
);

paymentsAdminRouter.post(
  '/:id/refund',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(uuidParamSchema, 'params'),
  validate(refundPaymentSchema),
  asyncHandler(paymentsController.refund),
);

paymentsAdminRouter.post(
  '/:id/reconcile',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(uuidParamSchema, 'params'),
  validate(reconcilePaymentSchema),
  asyncHandler(paymentsController.reconcile),
);
