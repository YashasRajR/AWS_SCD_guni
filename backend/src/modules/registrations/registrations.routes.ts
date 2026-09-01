import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { paginationQuerySchema, uuidParamSchema, updateRegistrationStatusSchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { registrationsController } from './registrations.controller.js';

// Mounted at /api/v1/admin/registrations. The attendee-owned "my
// registration" read lives in the user-dashboard module.
export const registrationsRouter = Router();

registrationsRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_REGISTRATIONS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(registrationsController.list),
);

registrationsRouter.patch(
  '/:id/status',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_REGISTRATIONS),
  validate(uuidParamSchema, 'params'),
  validate(updateRegistrationStatusSchema),
  asyncHandler(registrationsController.updateStatus),
);
