import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    await auditLogsService.log(req, 'USER_REGISTERED', 'user', result.user.id);
    sendCreated(res, result, 'Account created.');
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    await auditLogsService.log(req, 'USER_LOGIN', 'user', result.user.id);
    sendSuccess(res, result, 'Logged in.');
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const result = await authService.refresh(req.body);
    sendSuccess(res, result, 'Session refreshed.');
  },

  async logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req.body?.refreshToken);
    await auditLogsService.log(req, 'USER_LOGOUT', 'user', req.identity?.userId ?? null);
    sendSuccess(res, null, 'Logged out.');
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.forgotPassword(req.body);
    // Always the same response, whether or not the email exists.
    sendSuccess(res, null, 'If that email is registered, a reset link has been sent.');
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body);
    sendSuccess(res, null, 'Password updated. You can now log in.');
  },

  async verifyEmail(req: Request, res: Response): Promise<void> {
    await authService.verifyEmail(req.body);
    sendSuccess(res, null, 'Email verified.');
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    const result = await authService.changePassword(req.identity!.userId, req.body);
    sendSuccess(res, result, 'Password changed.');
  },
};
