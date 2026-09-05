import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createCheckpointSchema,
  updateCheckpointSchema,
  reverseAttendanceSchema,
  attendanceIdParamSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { checkpointsController } from './checkpoints.controller.js';

// Mounted at /api/v1/admin/checkpoints. The volunteer-facing checkpoint
// endpoints (list assigned, complete) live in the volunteers module.
export const checkpointsRouter = Router();

checkpointsRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_CHECKPOINTS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(checkpointsController.list),
);

checkpointsRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_CHECKPOINTS),
  validate(createCheckpointSchema),
  asyncHandler(checkpointsController.create),
);

// Registered before the /:id routes below — 'attendance' would otherwise
// be captured as a checkpoint id.
checkpointsRouter.get(
  '/attendance/export',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_CHECKPOINTS),
  asyncHandler(checkpointsController.exportAttendanceCsv),
);

checkpointsRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_CHECKPOINTS),
  validate(uuidParamSchema, 'params'),
  validate(updateCheckpointSchema),
  asyncHandler(checkpointsController.update),
);

checkpointsRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_CHECKPOINTS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(checkpointsController.remove),
);

// Correction/reversal — a mis-recorded attendance. Deliberately requires
// MANAGE_CHECKPOINTS (admin), not just COMPLETE_CHECKPOINT (volunteer) —
// undoing a completion is a correction, not a normal recording action.
checkpointsRouter.post(
  '/attendance/:attendanceId/reverse',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_CHECKPOINTS),
  validate(attendanceIdParamSchema, 'params'),
  validate(reverseAttendanceSchema),
  asyncHandler(checkpointsController.reverseAttendance),
);
