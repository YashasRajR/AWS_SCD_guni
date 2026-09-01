import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@scd/validation';
import { validate } from '../../middleware/validation/index.js';
import { authenticate } from '../../middleware/authentication/index.js';
import { createAuthRateLimiter } from '../../middleware/rate-limit/index.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authController } from './auth.controller.js';

export const authRouter = Router();
const authRateLimiter = createAuthRateLimiter();

authRouter.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);
authRouter.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(authController.login));
authRouter.post('/logout', authenticate, asyncHandler(authController.logout));
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
authRouter.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
authRouter.post(
  '/verify-email',
  authRateLimiter,
  validate(verifyEmailSchema),
  asyncHandler(authController.verifyEmail),
);
