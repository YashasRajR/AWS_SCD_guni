import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createFaqSchema,
  updateFaqSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { faqController } from './faq.controller.js';

// Public — mounted at /api/v1/faqs.
export const faqRouter = Router();

faqRouter.get('/', asyncHandler(faqController.list));

// Admin — mounted at /api/v1/admin/content/faqs.
export const faqAdminRouter = Router();

faqAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_FAQ),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(faqController.adminList),
);

faqAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_FAQ),
  validate(createFaqSchema),
  asyncHandler(faqController.create),
);

faqAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_FAQ),
  validate(uuidParamSchema, 'params'),
  validate(updateFaqSchema),
  asyncHandler(faqController.update),
);

faqAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_FAQ),
  validate(uuidParamSchema, 'params'),
  asyncHandler(faqController.remove),
);
