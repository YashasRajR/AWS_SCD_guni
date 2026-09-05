import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { paginationQuerySchema } from '@scd/validation';
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
  validate(paginationQuerySchema, 'query'),
  asyncHandler(attendeesController.list),
);
