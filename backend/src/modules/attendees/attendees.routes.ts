import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  attendeesListQuerySchema,
  updateAttendeeSchema,
  archiveAttendeeSchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { attendeesController } from './attendees.controller.js';

// Mounted at /api/v1/admin/attendees — attendee-owned /me/* reads live in
// the user-dashboard module instead.
export const attendeesRouter = Router();

attendeesRouter.get(
  '/export',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_ATTENDEE),
  asyncHandler(attendeesController.exportCsv),
);

attendeesRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_ATTENDEE),
  validate(attendeesListQuerySchema, 'query'),
  asyncHandler(attendeesController.list),
);

attendeesRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_ATTENDEE),
  validate(uuidParamSchema, 'params'),
  asyncHandler(attendeesController.getDetail),
);

attendeesRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.UPDATE_ATTENDEE),
  validate(uuidParamSchema, 'params'),
  validate(updateAttendeeSchema),
  asyncHandler(attendeesController.update),
);

attendeesRouter.post(
  '/:id/archive',
  authenticate,
  requirePermission(PERMISSIONS.UPDATE_ATTENDEE),
  validate(uuidParamSchema, 'params'),
  validate(archiveAttendeeSchema),
  asyncHandler(attendeesController.archive),
);

attendeesRouter.post(
  '/:id/restore',
  authenticate,
  requirePermission(PERMISSIONS.UPDATE_ATTENDEE),
  validate(uuidParamSchema, 'params'),
  asyncHandler(attendeesController.restore),
);

attendeesRouter.post(
  '/:id/reset-access',
  authenticate,
  requirePermission(PERMISSIONS.UPDATE_ATTENDEE),
  validate(uuidParamSchema, 'params'),
  asyncHandler(attendeesController.resetAccess),
);
