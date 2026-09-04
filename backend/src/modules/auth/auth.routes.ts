import { Router } from 'express';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@scd/validation';
import { authenticate } from '../../middleware/authentication/index.js';
import { validate } from '../../middleware/validation/index.js';
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
authRouter.post(
  '/refresh',
  authRateLimiter,
  validate(refreshTokenSchema),
  asyncHandler(authController.refresh),
);
// Deliberately no `authenticate` here: a client whose access token has
// already expired (the whole reason refresh tokens exist) must still be
// able to log out and revoke its refresh token — logging out is proving
// you hold the refresh token, not proving you hold a still-valid access
// token.
authRouter.post('/logout', authRateLimiter, validate(logoutSchema), asyncHandler(authController.logout));
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
// Authenticated (not the unauthenticated token-based reset flow above) —
// proves the CURRENT password rather than email ownership.
authRouter.post(
  '/change-password',
  authRateLimiter,
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
