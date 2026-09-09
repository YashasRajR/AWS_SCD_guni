import type { Request, Response } from 'express';
import { reportsService } from './reports.service.js';
import { sendSuccess } from '../../utils/response.js';

export const reportsController = {
  async getDashboard(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await reportsService.getDashboardSummary());
  },

  async getTrends(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await reportsService.getTrends());
  },

  async getRecentActivity(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await reportsService.getRecentActivity());
  },
};
