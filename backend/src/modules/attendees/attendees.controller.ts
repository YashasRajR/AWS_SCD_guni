import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import { attendeesService } from './attendees.service.js';
import { sendSuccess } from '../../utils/response.js';

export const attendeesController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    const data = await attendeesService.list(page, pageSize);
    sendSuccess(res, data);
  },
};
