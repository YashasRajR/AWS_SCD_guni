import type { Payment, PaymentStatus } from '@scd/types';

export interface PaymentRow {
  id: string;
  registration_id: string;
  provider: string | null;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paid_at: string | null;
  refunded_at: string | null;
  refund_amount: string | null;
  refund_provider_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentExportRow {
  registration_number: string;
  full_name: string;
  email: string;
  provider: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

export function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    registrationId: row.registration_id,
    provider: row.provider,
    providerOrderId: row.provider_order_id,
    providerPaymentId: row.provider_payment_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    paidAt: row.paid_at,
    refundedAt: row.refunded_at,
    refundAmount: row.refund_amount,
    refundProviderId: row.refund_provider_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
