import type { Request, Response } from 'express';
import type { PaginationQuery, RegenerateDocumentInput } from '@scd/validation';
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
    const { reason } = req.body as RegenerateDocumentInput;
    await ticketsService.reissuePdf(ticketId, reason, req.identity?.userId ?? null);
    await auditLogsService.log(req, 'TICKET_PDF_REISSUED', 'ticket', ticketId, { reason });
    sendSuccess(res, { reissued: true }, 'Ticket PDF regenerated.');
  },

  /** Version history for a ticket's PDF (spec #62). */
  async listVersions(req: Request, res: Response): Promise<void> {
    const versions = await ticketsService.listVersions(req.params.id!);
    sendSuccess(res, versions);
  },

  async getVersionPdf(req: Request, res: Response): Promise<void> {
    const pdf = await ticketsService.getVersionPdfBuffer(req.params.id!, Number(req.params.version));
    res.type('application/pdf').send(pdf);
  },

  /** Re-emails the ticket PDF to the attendee's own address (via emailsService's queue). */
  async resendEmail(req: Request, res: Response): Promise<void> {
    const ticketId = req.params.id!;
    await ticketsService.resendEmail(ticketId);
    await auditLogsService.log(req, 'TICKET_EMAIL_RESENT', 'ticket', ticketId, {});
    sendSuccess(res, { queued: true }, 'Ticket email queued for resend.');
  },
};
