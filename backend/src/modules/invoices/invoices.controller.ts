import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { PaginatedData, Invoice } from '@scd/types';
import { invoicesService } from './invoices.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendSuccess } from '../../utils/response.js';

export const invoicesController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    const data: PaginatedData<Invoice> = await invoicesService.list(page, pageSize);
    sendSuccess(res, data);
  },

  async getPdf(req: Request, res: Response): Promise<void> {
    const pdf = await invoicesService.getPdfBuffer(req.params.id!);
    res.type('application/pdf').send(pdf);
  },

  /** Re-emails the invoice PDF to the attendee's own address (via emailsService's queue). */
  async resendEmail(req: Request, res: Response): Promise<void> {
    const invoiceId = req.params.id!;
    await invoicesService.resendEmail(invoiceId);
    await auditLogsService.log(req, 'INVOICE_EMAIL_RESENT', 'invoice', invoiceId, {});
    sendSuccess(res, { queued: true }, 'Invoice email queued for resend.');
  },
};
