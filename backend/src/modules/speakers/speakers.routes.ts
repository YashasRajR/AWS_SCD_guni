import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createSpeakerSchema,
  updateSpeakerSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { speakersController } from './speakers.controller.js';

// Public — mounted at /api/v1/speakers.
export const speakersRouter = Router();

speakersRouter.get('/', asyncHandler(speakersController.list));
speakersRouter.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(speakersController.getById),
);

// Admin — mounted at /api/v1/admin/content/speakers. Sees/manages every
// status, not just PUBLISHED.
export const speakersAdminRouter = Router();

speakersAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SPEAKERS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(speakersController.adminList),
);

speakersAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SPEAKERS),
  validate(createSpeakerSchema),
  asyncHandler(speakersController.create),
);

speakersAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SPEAKERS),
  validate(uuidParamSchema, 'params'),
  validate(updateSpeakerSchema),
  asyncHandler(speakersController.update),
);

speakersAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SPEAKERS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(speakersController.remove),
);
