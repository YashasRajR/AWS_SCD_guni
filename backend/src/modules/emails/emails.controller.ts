import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { EmailRecord, PaginatedData } from '@scd/types';
import { emailsRepository } from './emails.repository.js';
import { toEmailRecord } from './emails.types.js';
import { sendSuccess } from '../../utils/response.js';

export const emailsController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    const { rows, total } = await emailsRepository.listAll(page, pageSize);
    const data: PaginatedData<EmailRecord> = {
      items: rows.map(toEmailRecord),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
    sendSuccess(res, data);
  },
};
