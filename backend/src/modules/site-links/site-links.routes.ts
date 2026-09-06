import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import type { SiteLinkKind } from '@scd/types';
import {
  createSiteLinkSchema,
  updateSiteLinkSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createSiteLinksController } from './site-links.controller.js';

/**
 * NAV and SOCIAL each get their own router bound to a fixed `kind`, mounted
 * at their own path (see routes/index.ts) -- rather than one router with a
 * client-supplied `kind` field/query param. This way the endpoint itself
 * determines which list a link belongs to, so there's no way to create or
 * edit a NAV link through the social-links endpoint (or vice versa).
 */
export function createSiteLinksRouters(kind: SiteLinkKind): { publicRouter: Router; adminRouter: Router } {
  const controller = createSiteLinksController(kind);

  const publicRouter = Router();
  publicRouter.get('/', asyncHandler(controller.list));

  const adminRouter = Router();
  // Reuses MANAGE_SETTINGS as the generic "can manage site-wide CMS
  // content" gate, same as ticket-plans/coupons/uploads.
  adminRouter.get(
    '/',
    authenticate,
    requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    validate(paginationQuerySchema, 'query'),
    asyncHandler(controller.adminList),
  );
  adminRouter.post(
    '/',
    authenticate,
    requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    validate(createSiteLinkSchema),
    asyncHandler(controller.create),
  );
  adminRouter.patch(
    '/:id',
    authenticate,
    requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    validate(uuidParamSchema, 'params'),
    validate(updateSiteLinkSchema),
    asyncHandler(controller.update),
  );
  adminRouter.delete(
    '/:id',
    authenticate,
    requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    validate(uuidParamSchema, 'params'),
    asyncHandler(controller.remove),
  );

  return { publicRouter, adminRouter };
}
