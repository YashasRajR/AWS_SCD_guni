import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '@scd/constants';
import {
  attendeeSearchQuerySchema,
  completeCheckpointSchema,
  paginationQuerySchema,
  uuidParamSchema,
  createVolunteerSchema,
  updateVolunteerSchema,
  assignCheckpointSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission, requireRole } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { volunteersController } from './volunteers.controller.js';

const volunteerCheckpointParamsSchema = z.object({
  id: z.string().uuid(),
  checkpointId: z.string().uuid(),
});

// Self-service volunteer routes — mounted at /api/v1/volunteer.
export const volunteerSelfRouter = Router();

volunteerSelfRouter.get('/me', authenticate, requireRole('VOLUNTEER'), asyncHandler(volunteersController.getMe));

volunteerSelfRouter.get(
  '/checkpoints',
  authenticate,
  requireRole('VOLUNTEER'),
  asyncHandler(volunteersController.getAssignedCheckpoints),
);

volunteerSelfRouter.get(
  '/history',
  authenticate,
  requireRole('VOLUNTEER'),
  asyncHandler(volunteersController.getHistory),
);

volunteerSelfRouter.get(
  '/attendees/search',
  authenticate,
  requireRole('VOLUNTEER'),
  requirePermission(PERMISSIONS.VIEW_ATTENDEE),
  validate(attendeeSearchQuerySchema, 'query'),
  asyncHandler(volunteersController.searchAttendees),
);

volunteerSelfRouter.post(
  '/checkpoints/complete',
  authenticate,
  requireRole('VOLUNTEER'),
  requirePermission(PERMISSIONS.COMPLETE_CHECKPOINT),
  validate(completeCheckpointSchema),
  asyncHandler(volunteersController.completeCheckpoint),
);

// Admin management — mounted at /api/v1/admin/volunteers.
export const volunteersRouter = Router();

volunteersRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VOLUNTEERS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(volunteersController.list),
);

volunteersRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VOLUNTEERS),
  validate(createVolunteerSchema),
  asyncHandler(volunteersController.create),
);

volunteersRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VOLUNTEERS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(volunteersController.getById),
);

volunteersRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VOLUNTEERS),
  validate(uuidParamSchema, 'params'),
  validate(updateVolunteerSchema),
  asyncHandler(volunteersController.update),
);

volunteersRouter.get(
  '/:id/checkpoints',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VOLUNTEERS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(volunteersController.getAssignedCheckpointsAdmin),
);

volunteersRouter.post(
  '/:id/checkpoints',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VOLUNTEERS),
  validate(uuidParamSchema, 'params'),
  validate(assignCheckpointSchema),
  asyncHandler(volunteersController.assignCheckpoint),
);

volunteersRouter.delete(
  '/:id/checkpoints/:checkpointId',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_VOLUNTEERS),
  validate(volunteerCheckpointParamsSchema, 'params'),
  asyncHandler(volunteersController.revokeCheckpoint),
);
