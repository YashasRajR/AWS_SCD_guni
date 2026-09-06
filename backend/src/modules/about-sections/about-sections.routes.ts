import { Router } from 'express';
import { PERMISSIONS } from '@scd/constants';
import {
  createAboutSectionSchema,
  updateAboutSectionSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requirePermission } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { aboutSectionsController } from './about-sections.controller.js';

// Public — mounted at /api/v1/about-sections.
export const aboutSectionsRouter = Router();
aboutSectionsRouter.get('/', asyncHandler(aboutSectionsController.list));

// Admin — mounted at /api/v1/admin/content/about-sections.
export const aboutSectionsAdminRouter = Router();

aboutSectionsAdminRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(aboutSectionsController.adminList),
);

aboutSectionsAdminRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(createAboutSectionSchema),
  asyncHandler(aboutSectionsController.create),
);

aboutSectionsAdminRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  validate(updateAboutSectionSchema),
  asyncHandler(aboutSectionsController.update),
);

aboutSectionsAdminRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  validate(uuidParamSchema, 'params'),
  asyncHandler(aboutSectionsController.remove),
);
