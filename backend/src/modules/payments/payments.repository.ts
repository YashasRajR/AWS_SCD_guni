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

  /** Creates the PENDING payment row for a registration. No gateway call yet. */
  async createPending(registrationId: string, amount: string, currency = 'INR'): Promise<PaymentRow> {
    const { rows } = await getPool().query<PaymentRow>(
      `INSERT INTO payments (registration_id, amount, currency, status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING *`,
      [registrationId, amount, currency],
    );
    return rows[0]!;
  },
};
