import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '@scd/constants';
import { paginationQuerySchema, uuidParamSchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { certificatesController } from './certificates.controller.js';

const issueCertificateSchema = z.object({
  attendeeId: z.string().uuid(),
  certificateType: z.enum(['PARTICIPATION', 'SESSION', 'ACHIEVEMENT']).default('PARTICIPATION'),
  title: z.string().trim().min(1).max(300),
});

/** Mounted at /api/v1/certificates — public, no authentication. */
export const certificatesPublicRouter = Router();
certificatesPublicRouter.get('/verify/:certificateNumber', asyncHandler(certificatesController.verify));

/** Mounted at /api/v1/admin/certificates. */
export const certificatesAdminRouter = Router();

certificatesAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_CERTIFICATES),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(certificatesController.list),
);

certificatesAdminRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_CERTIFICATES),
  validate(uuidParamSchema, 'params'),
  asyncHandler(certificatesController.getById),
);

certificatesAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_CERTIFICATES),
  validate(issueCertificateSchema),
  asyncHandler(certificatesController.issue),
);

certificatesAdminRouter.patch(
  '/:id/revoke',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_CERTIFICATES),
  validate(uuidParamSchema, 'params'),
  asyncHandler(certificatesController.revoke),
);
