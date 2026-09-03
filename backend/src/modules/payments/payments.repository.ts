import { getPool } from '../../config/database.js';
import type { PaymentRow } from './payments.types.js';

export const paymentsRepository = {
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

  async markFailed(id: string): Promise<PaymentRow> {
    const { rows } = await getPool().query<PaymentRow>(
      `UPDATE payments SET status = 'FAILED' WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0]!;
  },

  /** Admin listing, newest first. */
  async list(page: number, pageSize: number): Promise<{ rows: PaymentRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<PaymentRow>(
        'SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM payments'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },
};
