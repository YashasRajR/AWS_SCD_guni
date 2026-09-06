import { Router } from 'express';
import { authenticate } from '../../middleware/authentication/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { searchController } from './search.controller.js';

// Mounted at /api/v1/admin/search. No single required permission — any
// admin-panel role may search, but searchService only queries the
// categories the caller's own permissions allow.
export const searchRouter = Router();

searchRouter.get('/', authenticate, asyncHandler(searchController.search));
