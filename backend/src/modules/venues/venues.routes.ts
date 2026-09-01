import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createVenueSchema,
  updateVenueSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { venuesController } from './venues.controller.js';

// Public — mounted at /api/v1/venues.
export const venuesRouter = Router();

venuesRouter.get('/', asyncHandler(venuesController.list));

// Admin — mounted at /api/v1/admin/content/venues.
export const venuesAdminRouter = Router();

venuesAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VENUES),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(venuesController.adminList),
);

venuesAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VENUES),
  validate(createVenueSchema),
  asyncHandler(venuesController.create),
);

venuesAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VENUES),
  validate(uuidParamSchema, 'params'),
  validate(updateVenueSchema),
  asyncHandler(venuesController.update),
);

venuesAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VENUES),
  validate(uuidParamSchema, 'params'),
  asyncHandler(venuesController.remove),
);
