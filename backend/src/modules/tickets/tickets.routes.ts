import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { paginationQuerySchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ticketsController } from './tickets.controller.js';

export const ticketsAdminRouter = Router();

ticketsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_REGISTRATIONS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(ticketsController.list),
);
