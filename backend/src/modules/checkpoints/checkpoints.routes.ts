import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createCheckpointSchema,
  updateCheckpointSchema,
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
