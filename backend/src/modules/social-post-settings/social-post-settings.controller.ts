import type { Request, Response } from 'express';
import type { UpdateSocialPostSettingsInput } from '@scd/validation';
import { socialPostSettingsService } from './social-post-settings.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendSuccess } from '../../utils/response.js';

export const socialPostSettingsController = {
  /** Admin — GET /api/v1/admin/content/social-post-settings */
  async get(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await socialPostSettingsService.get());
  },

  async update(req: Request, res: Response): Promise<void> {
    const settings = await socialPostSettingsService.update(req.body as UpdateSocialPostSettingsInput);
    await auditLogsService.log(req, 'SOCIAL_POST_SETTINGS_UPDATED', 'social_post_settings', '1');
    sendSuccess(res, settings, 'Settings updated.');
  },
};
