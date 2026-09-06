import type { Request, Response } from 'express';
import { systemStatusService } from './system-status.service.js';
import { sendSuccess } from '../../utils/response.js';

export const systemStatusController = {
  async get(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await systemStatusService.getStatus());
  },
};
