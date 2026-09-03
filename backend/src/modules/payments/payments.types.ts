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
  created_at: string;
  updated_at: string;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
