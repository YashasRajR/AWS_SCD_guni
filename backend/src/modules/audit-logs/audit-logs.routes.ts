import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import { paginationQuerySchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { auditLogsController } from './audit-logs.controller.js';

export const auditLogsRouter = Router();

auditLogsRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(auditLogsController.list),
);
