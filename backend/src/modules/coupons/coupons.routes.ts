import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { createCouponSchema, updateCouponSchema, paginationQuerySchema, uuidParamSchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { couponsController } from './coupons.controller.js';

// Admin only -- mounted at /api/v1/admin/content/coupons. No public
// router: unlike FAQs/announcements/ticket-plans, coupons are never listed
// publicly, only validated one at a time (see /me/coupons/preview in
// user-dashboard.routes.ts). Reuses MANAGE_SETTINGS, same as ticket-plans.
export const couponsAdminRouter = Router();

couponsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(couponsController.adminList),
);

couponsAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(createCouponSchema),
  asyncHandler(couponsController.create),
);

couponsAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  validate(updateCouponSchema),
  asyncHandler(couponsController.update),
);

couponsAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(couponsController.remove),
);
