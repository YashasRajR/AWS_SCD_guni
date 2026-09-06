import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import { sheetsSyncService } from './sheets-sync.service.js';
import { sendSuccess } from '../../utils/response.js';

export const sheetsSyncController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    sendSuccess(res, await sheetsSyncService.list(page, pageSize));
  },
};
