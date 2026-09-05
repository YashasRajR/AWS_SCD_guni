import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '@scd/constants';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { qrTokensController } from './qr-tokens.controller.js';

const ticketParamsSchema = z.object({ ticketId: z.string().uuid() });
const rotateParamsSchema = z.object({
  ticketId: z.string().uuid(),
  type: z.enum(['REGISTRATION', 'GOODIE']),
});
const idParamsSchema = z.object({ id: z.string().uuid() });

// Nested under a ticket — mounted at /api/v1/admin/tickets/:ticketId/qr-tokens.
export const qrTokensByTicketRouter = Router({ mergeParams: true });

qrTokensByTicketRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_QR_TOKENS),
  validate(ticketParamsSchema, 'params'),
  asyncHandler(qrTokensController.listForTicket),
);

qrTokensByTicketRouter.post(
  '/:type/rotate',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_QR_TOKENS),
  validate(rotateParamsSchema, 'params'),
  asyncHandler(qrTokensController.rotate),
);

// Standalone by token id — mounted at /api/v1/admin/qr-tokens.
export const qrTokensAdminRouter = Router();

qrTokensAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_QR_TOKENS),
  validate(idParamsSchema, 'params'),
  asyncHandler(qrTokensController.revoke),
);
