import type { Request, Response } from 'express';
import type { PaymentsListQuery, RefundPaymentInput, ReconcilePaymentInput } from '@scd/validation';
import { paymentsService } from './payments.service.js';
import { attendeesService } from '../attendees/attendees.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
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
    const { page, pageSize, search, status } = req.query as unknown as PaymentsListQuery;
    sendSuccess(res, await paymentsService.list(page, pageSize, search, status));
  },

  async getDetail(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await paymentsService.getDetail(req.params.id as string));
  },

  /** Live gateway status -- not itself a mutation, so no audit entry. */
  async gatewayStatus(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await paymentsService.fetchGatewayStatus(req.params.id as string));
  },

  async retryVerification(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const before = await paymentsService.getDetail(id);
    const payment = await paymentsService.retryVerification(id);
    await auditLogsService.log(req, 'PAYMENT_VERIFICATION_RETRIED', 'payment', id, {
      fromStatus: before.payment.status,
      toStatus: payment.status,
    });
    sendSuccess(res, payment);
  },

  async refund(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { reason, amount } = req.body as RefundPaymentInput;
    const payment = await paymentsService.refund(id, amount !== undefined ? String(amount) : undefined);
    await auditLogsService.log(req, 'PAYMENT_REFUNDED', 'payment', id, { reason, amount: payment.refundAmount });
    sendSuccess(res, payment);
  },

  async reconcile(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status, reason } = req.body as ReconcilePaymentInput;
    const payment = await paymentsService.reconcile(id, status);
    await auditLogsService.log(req, 'PAYMENT_RECONCILED', 'payment', id, { toStatus: status, reason });
    sendSuccess(res, payment);
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
