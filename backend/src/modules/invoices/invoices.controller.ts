import type { Request, Response } from 'express';
import type { PaginationQuery, RegenerateDocumentInput } from '@scd/validation';
import type { PaginatedData, Invoice } from '@scd/types';
import { invoicesService } from './invoices.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendSuccess } from '../../utils/response.js';

export const invoicesController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize, search } = req.query as unknown as PaginationQuery;
    const data: PaginatedData<Invoice> = await invoicesService.list(page, pageSize, search);
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

  /** Rebuilds the invoice PDF from current data (spec #62); the one it replaces is archived first. */
  async regenerate(req: Request, res: Response): Promise<void> {
    const invoiceId = req.params.id!;
    const { reason } = req.body as RegenerateDocumentInput;
    await invoicesService.regenerate(invoiceId, reason, req.identity?.userId ?? null);
    await auditLogsService.log(req, 'INVOICE_PDF_REGENERATED', 'invoice', invoiceId, { reason });
    sendSuccess(res, { regenerated: true }, 'Invoice PDF regenerated.');
  },

  /** Version history for an invoice's PDF (spec #62). */
  async listVersions(req: Request, res: Response): Promise<void> {
    const versions = await invoicesService.listVersions(req.params.id!);
    sendSuccess(res, versions);
  },

  async getVersionPdf(req: Request, res: Response): Promise<void> {
    const pdf = await invoicesService.getVersionPdfBuffer(req.params.id!, Number(req.params.version));
    res.type('application/pdf').send(pdf);
  },
};
