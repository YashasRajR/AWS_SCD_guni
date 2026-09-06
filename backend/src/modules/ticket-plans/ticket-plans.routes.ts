import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createTicketPlanSchema,
  updateTicketPlanSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ticketPlansController } from './ticket-plans.controller.js';

// Public -- mounted at /api/v1/ticket-plans. Active plans only, for the
// registration form's plan picker.
export const ticketPlansRouter = Router();

ticketPlansRouter.get('/', asyncHandler(ticketPlansController.list));

// Admin -- mounted at /api/v1/admin/content/ticket-plans. Reuses
// MANAGE_SETTINGS (same permission as event config) rather than adding a
// new permission code for what is, operationally, part of event setup.
export const ticketPlansAdminRouter = Router();

ticketPlansAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(ticketPlansController.adminList),
);

ticketPlansAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(createTicketPlanSchema),
  asyncHandler(ticketPlansController.create),
);

ticketPlansAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  validate(updateTicketPlanSchema),
  asyncHandler(ticketPlansController.update),
);

ticketPlansAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(ticketPlansController.remove),
);
