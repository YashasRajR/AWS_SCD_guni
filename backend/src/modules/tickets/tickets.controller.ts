import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import { ticketsRepository } from './tickets.repository.js';
import { toTicket } from './tickets.types.js';
import { sendSuccess } from '../../utils/response.js';
import type { PaginatedData } from '@scd/types';
import type { Ticket } from '@scd/types';

export const ticketsController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    const { rows, total } = await ticketsRepository.list(page, pageSize);
    const data: PaginatedData<Ticket> = {
      items: rows.map(toTicket),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
    sendSuccess(res, data);
  },
};
