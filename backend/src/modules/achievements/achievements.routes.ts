import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '@scd/constants';
import { CONTENT_STATUSES, ACHIEVEMENT_CONDITION_TYPES } from '@scd/types';
import { paginationQuerySchema, uuidParamSchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { achievementsController } from './achievements.controller.js';

const createAchievementSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(2000).optional(),
  iconUrl: z.string().trim().url().optional(),
  conditionType: z.enum(ACHIEVEMENT_CONDITION_TYPES).default('MANUAL'),
  conditionConfig: z.record(z.unknown()).optional(),
  displayOrder: z.number().int().min(0).default(0),
  status: z.enum(CONTENT_STATUSES).default('DRAFT'),
});

const updateAchievementSchema = createAchievementSchema.partial();

export const achievementsAdminRouter = Router();

achievementsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ACHIEVEMENTS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(achievementsController.list),
);

achievementsAdminRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ACHIEVEMENTS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(achievementsController.getById),
);

achievementsAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ACHIEVEMENTS),
  validate(createAchievementSchema),
  asyncHandler(achievementsController.create),
);

achievementsAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ACHIEVEMENTS),
  validate(uuidParamSchema, 'params'),
  validate(updateAchievementSchema),
  asyncHandler(achievementsController.update),
);

achievementsAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_ACHIEVEMENTS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(achievementsController.remove),
);
