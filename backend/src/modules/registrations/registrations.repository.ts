import { getPool } from '../../config/database.js';
import { generateReferenceCode } from '@scd/utils';
import type { RegistrationRow } from './registrations.types.js';

export const registrationsRepository = {
  /**
   * Creates a PENDING registration for an attendee. The full registration
   * flow (payment, confirmation) is implemented in a later phase — this
   * establishes the data model + service boundary now, per spec.
   */
  async create(attendeeId: string): Promise<RegistrationRow> {
    const { rows } = await getPool().query<RegistrationRow>(
      `INSERT INTO registrations (attendee_id, registration_number)
       VALUES ($1, $2)
       RETURNING *`,
      [attendeeId, generateReferenceCode('REG')],
    );
    return rows[0]!;
  },

  async findByAttendeeId(attendeeId: string): Promise<RegistrationRow | null> {
    const { rows } = await getPool().query<RegistrationRow>(
      'SELECT * FROM registrations WHERE attendee_id = $1 ORDER BY created_at DESC LIMIT 1',
      [attendeeId],
    );
    return rows[0] ?? null;
  },

  async findByRegistrationNumber(registrationNumber: string): Promise<RegistrationRow | null> {
    const { rows } = await getPool().query<RegistrationRow>(
      'SELECT * FROM registrations WHERE registration_number = $1',
      [registrationNumber],
    );
    return rows[0] ?? null;
  },

  async list(page: number, pageSize: number): Promise<{ rows: RegistrationRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<RegistrationRow>(
        'SELECT * FROM registrations ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM registrations'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  async findById(id: string): Promise<RegistrationRow | null> {
    const { rows } = await getPool().query<RegistrationRow>(
      'SELECT * FROM registrations WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  /**
   * Admin status change. Also stamps confirmed_at/cancelled_at when the
   * new status is CONFIRMED/CANCELLED — mirrors what the (future) payment
   * and cancellation flows would set automatically.
   */
  async updateStatus(id: string, status: RegistrationRow['status']): Promise<RegistrationRow | null> {
    const { rows } = await getPool().query<RegistrationRow>(
      `UPDATE registrations
       SET status = $2,
           confirmed_at = CASE WHEN $2 = 'CONFIRMED' THEN now() ELSE confirmed_at END,
           cancelled_at = CASE WHEN $2 = 'CANCELLED' THEN now() ELSE cancelled_at END
       WHERE id = $1
       RETURNING *`,
      [id, status],
    );
    return rows[0] ?? null;
  },
};
