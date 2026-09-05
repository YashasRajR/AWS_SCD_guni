import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import { ticketsRepository } from './tickets.repository.js';
import { ticketsService } from './tickets.service.js';
import { toTicket } from './tickets.types.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
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

  async getPdf(req: Request, res: Response): Promise<void> {
    const pdf = await ticketsService.getPdfBuffer(req.params.id!);
    res.type('application/pdf').send(pdf);
  },

  /** Rotates both QR tokens and regenerates the PDF — e.g. resending a lost ticket. */
  async reissuePdf(req: Request, res: Response): Promise<void> {
    const ticketId = req.params.id!;
    await ticketsService.reissuePdf(ticketId);
    await auditLogsService.log(req, 'TICKET_PDF_REISSUED', 'ticket', ticketId, {});
    sendSuccess(res, { reissued: true }, 'Ticket PDF regenerated.');
  },
};
