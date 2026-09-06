import { Router } from 'express';
import { registerForEventSchema } from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { requireRole } from '../../middleware/authorization/index.js';
import { validate } from '../../middleware/validation/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { userDashboardController } from './user-dashboard.controller.js';

// Mounted at /api/v1/me — every route here resolves data from
// req.identity (set by `authenticate`), never from a client-supplied id.
export const userDashboardRouter = Router();

userDashboardRouter.use(authenticate, requireRole('ATTENDEE'));

userDashboardRouter.get('/', asyncHandler(userDashboardController.getMe));
userDashboardRouter.get('/profile', asyncHandler(userDashboardController.getProfile));
userDashboardRouter.get('/registration', asyncHandler(userDashboardController.getRegistration));
userDashboardRouter.post(
  '/registration',
  validate(registerForEventSchema),
  asyncHandler(userDashboardController.createRegistration),
);
userDashboardRouter.get('/ticket', asyncHandler(userDashboardController.getTicket));
userDashboardRouter.get('/ticket/pdf', asyncHandler(userDashboardController.getTicketPdf));
userDashboardRouter.get('/payment', asyncHandler(userDashboardController.getPayment));
userDashboardRouter.post('/payment/initiate', asyncHandler(userDashboardController.initiatePayment));
userDashboardRouter.get('/progress', asyncHandler(userDashboardController.getProgress));
userDashboardRouter.get('/sessions', asyncHandler(userDashboardController.getSessions));
userDashboardRouter.get('/certificates', asyncHandler(userDashboardController.getCertificates));
userDashboardRouter.get('/achievements', asyncHandler(userDashboardController.getAchievements));
userDashboardRouter.get('/event-wrapped', asyncHandler(userDashboardController.getEventWrapped));
