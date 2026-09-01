import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import { auditLogsService } from './audit-logs.service.js';
import { sendSuccess } from '../../utils/response.js';

export const auditLogsController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    const data = await auditLogsService.list(page, pageSize);
    sendSuccess(res, data);
  },
};
