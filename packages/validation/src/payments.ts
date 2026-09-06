import { z } from 'zod';
import { PAYMENT_STATUSES } from '@scd/types';
import { paginationQuerySchema } from './common.js';

// --- Admin: list payments, optionally filtered by status (spec #36) -------
export const paymentsListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(PAYMENT_STATUSES).optional(),
});
export type PaymentsListQuery = z.infer<typeof paymentsListQuerySchema>;

// --- Admin: initiate a refund at the gateway -------------------------------
export const refundPaymentSchema = z.object({
  reason: z.string().trim().min(3).max(500),
  /** Defaults to the full payment amount when omitted. */
  amount: z.coerce.number().positive().optional(),
});
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

// --- Admin: record a manual reconciliation ---------------------------------
export const reconcilePaymentSchema = z.object({
  status: z.enum(['PAID', 'FAILED', 'REFUNDED']),
  reason: z.string().trim().min(3).max(500),
});
export type ReconcilePaymentInput = z.infer<typeof reconcilePaymentSchema>;
