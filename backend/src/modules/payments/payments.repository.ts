import { getPool } from '../../config/database.js';
import type { PaymentStatus } from '@scd/types';
import type { PaymentExportRow, PaymentRow } from './payments.types.js';

export interface PaymentEventInsert {
  provider: string;
  providerEventId: string;
  eventType: string;
  paymentId: string | null;
  metadata?: Record<string, unknown>;
}

export const paymentsRepository = {
  /**
   * Records a webhook delivery before any processing happens. Returns the
   * new row's id, or null if (provider, providerEventId) already exists —
   * i.e. this exact event was already received, so the caller should
   * treat it as a no-op duplicate rather than reprocessing. This is the
   * database-enforced half of webhook idempotency; the payment-status
   * check in payments.service.ts's handleWebhook is the second layer.
   */
  async recordWebhookEventIfNew(event: PaymentEventInsert): Promise<string | null> {
    const { rows } = await getPool().query<{ id: string }>(
      `INSERT INTO payment_events (provider, provider_event_id, event_type, payment_id, metadata)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider, provider_event_id) DO NOTHING
       RETURNING id`,
      [event.provider, event.providerEventId, event.eventType, event.paymentId, event.metadata ?? null],
    );
    return rows[0]?.id ?? null;
  },

  async markWebhookEventProcessed(
    id: string,
    status: 'PROCESSED' | 'IGNORED' | 'ERROR',
    errorMessage?: string,
  ): Promise<void> {
    await getPool().query(
      `UPDATE payment_events
       SET processing_status = $2, processed_at = now(), error_message = $3
       WHERE id = $1`,
      [id, status, errorMessage ?? null],
    );
  },

  async findByRegistrationId(registrationId: string): Promise<PaymentRow | null> {
    const { rows } = await getPool().query<PaymentRow>(
      'SELECT * FROM payments WHERE registration_id = $1 ORDER BY created_at DESC LIMIT 1',
      [registrationId],
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<PaymentRow | null> {
    const { rows } = await getPool().query<PaymentRow>('SELECT * FROM payments WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  /** The webhook payload only carries the provider's order id — this is how it maps back to our row. */
  async findByProviderOrderId(provider: string, providerOrderId: string): Promise<PaymentRow | null> {
    const { rows } = await getPool().query<PaymentRow>(
      'SELECT * FROM payments WHERE provider = $1 AND provider_order_id = $2',
      [provider, providerOrderId],
    );
    return rows[0] ?? null;
  },

  /** Creates the PENDING payment row for a registration. No gateway call yet. */
  async createPending(registrationId: string, amount: string, currency: string): Promise<PaymentRow> {
    const { rows } = await getPool().query<PaymentRow>(
      `INSERT INTO payments (registration_id, amount, currency, status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING *`,
      [registrationId, amount, currency],
    );
    return rows[0]!;
  },

  /** Records the provider order id once created and flips to PROCESSING (payer mid-checkout). */
  async attachProviderOrder(id: string, provider: string, providerOrderId: string): Promise<PaymentRow> {
    const { rows } = await getPool().query<PaymentRow>(
      `UPDATE payments
       SET provider = $2, provider_order_id = $3, status = 'PROCESSING'
       WHERE id = $1
       RETURNING *`,
      [id, provider, providerOrderId],
    );
    return rows[0]!;
  },

  async markPaid(id: string, providerPaymentId: string): Promise<PaymentRow> {
    const { rows } = await getPool().query<PaymentRow>(
      `UPDATE payments
       SET status = 'PAID', provider_payment_id = $2, paid_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, providerPaymentId],
    );
    return rows[0]!;
  },

  /** Gateway-initiated or manual refund (spec #36) -- providerRefundId is
   * null for a manual (non-gateway) refund. */
  async markRefunded(id: string, refundAmount: string, providerRefundId: string | null): Promise<PaymentRow> {
    const { rows } = await getPool().query<PaymentRow>(
      `UPDATE payments
       SET status = 'REFUNDED', refunded_at = now(), refund_amount = $2, refund_provider_id = $3
       WHERE id = $1
       RETURNING *`,
      [id, refundAmount, providerRefundId],
    );
    return rows[0]!;
  },

  async markFailed(id: string): Promise<PaymentRow> {
    const { rows } = await getPool().query<PaymentRow>(
      `UPDATE payments SET status = 'FAILED' WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0]!;
  },

  /** Full attendee + registration join for the admin CSV export — same
   * pattern as registrations.repository.ts's listForExport(). */
  async listForExport(): Promise<PaymentExportRow[]> {
    const { rows } = await getPool().query<PaymentExportRow>(
      `SELECT
         r.registration_number,
         a.full_name,
         u.email,
         p.provider,
         p.amount,
         p.currency,
         p.status,
         p.paid_at,
         p.created_at
       FROM payments p
       JOIN registrations r ON r.id = p.registration_id
       JOIN attendees a ON a.id = r.attendee_id
       JOIN users u ON u.id = a.user_id
       ORDER BY p.created_at DESC`,
    );
    return rows;
  },

  /** Admin listing, newest first. Optional search matches the gateway
   * order/payment id or the registration it belongs to. */
  async list(
    page: number,
    pageSize: number,
    search?: string,
    status?: PaymentStatus,
  ): Promise<{ rows: PaymentRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const hasSearch = Boolean(search && search.trim());
    const values: unknown[] = hasSearch ? [`%${search!.trim()}%`] : [];
    const conditions: string[] = [];
    if (hasSearch) {
      conditions.push('(p.provider_payment_id ILIKE $1 OR p.provider_order_id ILIKE $1 OR r.registration_number ILIKE $1)');
    }
    if (status) {
      values.push(status);
      conditions.push(`p.status = $${values.length}`);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const join = hasSearch ? 'JOIN registrations r ON r.id = p.registration_id' : '';
    const limitIdx = values.length + 1;
    const offsetIdx = values.length + 2;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<PaymentRow>(
        `SELECT p.* FROM payments p ${join} ${where} ORDER BY p.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        [...values, pageSize, offset],
      ),
      getPool().query<{ count: string }>(`SELECT count(*) FROM payments p ${join} ${where}`, values),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },
};
