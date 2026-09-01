import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createAgendaItemSchema,
  updateAgendaItemSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { agendaController } from './agenda.controller.js';

// Public — mounted at /api/v1/agenda.
export const agendaRouter = Router();

agendaRouter.get('/', asyncHandler(agendaController.list));

// Admin — mounted at /api/v1/admin/content/agenda.
export const agendaAdminRouter = Router();

agendaAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_AGENDA),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(agendaController.adminList),
);

agendaAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_AGENDA),
  validate(createAgendaItemSchema),
  asyncHandler(agendaController.create),
);

agendaAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_AGENDA),
  validate(uuidParamSchema, 'params'),
  validate(updateAgendaItemSchema),
  asyncHandler(agendaController.update),
);

agendaAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_AGENDA),
  validate(uuidParamSchema, 'params'),
  asyncHandler(agendaController.remove),
);
