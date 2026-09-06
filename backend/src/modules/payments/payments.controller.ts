import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import { paymentsService } from './payments.service.js';
import { attendeesService } from '../attendees/attendees.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/errors.js';

export const paymentsController = {
  async exportCsv(_req: Request, res: Response): Promise<void> {
    const csv = await paymentsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
    res.send(csv);
  },

  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize, search } = req.query as unknown as PaginationQuery;
    sendSuccess(res, await paymentsService.list(page, pageSize, search));
  },

  /** Attendee-owned: starts a checkout for the caller's own registration. */
  async initiate(req: Request, res: Response): Promise<void> {
    if (!req.identity) throw AppError.authRequired();
    const attendee = await attendeesService.requireByUserId(req.identity.userId);
    const result = await paymentsService.initiatePayment(attendee.id);
    sendSuccess(res, result);
  },

  /**
   * Public — called by the payment provider, not the browser. Signature
   * verification inside handleWebhook stands in for auth here; there is
   * deliberately no `authenticate` middleware on this route. Needs the
   * exact raw request bytes, captured by server/app.ts's
   * express.json({ verify }) into req.rawBody before Express parses it —
   * re-serializing req.body would not reproduce the same bytes the
   * provider signed.
   */
  async webhook(req: Request, res: Response): Promise<void> {
    const rawBody = req.rawBody?.toString('utf8') ?? '';
    const signature = req.headers['x-razorpay-signature'];
    await paymentsService.handleWebhook(rawBody, typeof signature === 'string' ? signature : undefined);
    // Acknowledge receipt so the provider stops retrying; the outcome of
    // processing this event was already handled above.
    res.status(200).json({ success: true });
  },
};
