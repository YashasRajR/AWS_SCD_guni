import { getPool } from '../../config/database.js';
import { generateReferenceCode } from '@scd/utils';
import type { RegistrationExportRow, RegistrationRow } from './registrations.types.js';

// Every read below joins in the selected ticket plan (if any) so
// registrations.types.ts can embed it on the Registration the API returns,
// rather than making the frontend fetch it separately.
const SELECT_WITH_TICKET_PLAN = `
  SELECT
    r.*,
    tp.id AS tp_id,
    tp.code AS tp_code,
    tp.name AS tp_name,
    tp.description AS tp_description,
    tp.price AS tp_price,
    tp.currency AS tp_currency,
    tp.is_active AS tp_is_active,
    tp.display_order AS tp_display_order,
    tp.created_at AS tp_created_at,
    tp.updated_at AS tp_updated_at
  FROM registrations r
  LEFT JOIN ticket_plans tp ON tp.id = r.ticket_plan_id
`;

export const registrationsRepository = {
  /**
   * Creates a PENDING registration for an attendee against a specific
   * ticket plan. The full registration flow (payment, confirmation) is
   * implemented in a later phase -- this establishes the data model +
   * service boundary now, per spec.
   */
  async create(attendeeId: string, ticketPlanId: string): Promise<RegistrationRow> {
    const { rows } = await getPool().query<{ id: string }>(
      `INSERT INTO registrations (attendee_id, registration_number, ticket_plan_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [attendeeId, generateReferenceCode('REG'), ticketPlanId],
    );
    return (await this.findById(rows[0]!.id))!;
  },

  async findByAttendeeId(attendeeId: string): Promise<RegistrationRow | null> {
    const { rows } = await getPool().query<RegistrationRow>(
      `${SELECT_WITH_TICKET_PLAN} WHERE r.attendee_id = $1 ORDER BY r.created_at DESC LIMIT 1`,
      [attendeeId],
    );
    return rows[0] ?? null;
  },

  async findByRegistrationNumber(registrationNumber: string): Promise<RegistrationRow | null> {
    const { rows } = await getPool().query<RegistrationRow>(
      `${SELECT_WITH_TICKET_PLAN} WHERE r.registration_number = $1`,
      [registrationNumber],
    );
    return rows[0] ?? null;
  },

  async list(page: number, pageSize: number): Promise<{ rows: RegistrationRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<RegistrationRow>(
        `${SELECT_WITH_TICKET_PLAN} ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM registrations'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  /**
   * Full attendee + ticket plan + payment join for the admin CSV export.
   * Unbounded by design — an admin exporting the list wants everything,
   * not a page of it — but this is a single-event platform (see
   * registrations.service create()), so row counts stay in the thousands
   * at most.
   */
  async listForExport(): Promise<RegistrationExportRow[]> {
    const { rows } = await getPool().query<RegistrationExportRow>(
      `SELECT
         r.registration_number,
         r.status,
         a.full_name,
         u.email,
         a.phone,
         a.university,
         a.department,
         a.year,
         tp.name AS ticket_plan_name,
         r.registered_at,
         r.confirmed_at,
         p.status AS payment_status,
         p.amount AS payment_amount,
         p.currency AS payment_currency
       FROM registrations r
       JOIN attendees a ON a.id = r.attendee_id
       JOIN users u ON u.id = a.user_id
       LEFT JOIN ticket_plans tp ON tp.id = r.ticket_plan_id
       LEFT JOIN payments p ON p.registration_id = r.id
       ORDER BY r.created_at DESC`,
    );
    return rows;
  },

  async findById(id: string): Promise<RegistrationRow | null> {
    const { rows } = await getPool().query<RegistrationRow>(`${SELECT_WITH_TICKET_PLAN} WHERE r.id = $1`, [id]);
    return rows[0] ?? null;
  },

  /**
   * Admin status change. Also stamps confirmed_at/cancelled_at when the
   * new status is CONFIRMED/CANCELLED — mirrors what the (future) payment
   * and cancellation flows would set automatically.
   */
  async updateStatus(id: string, status: RegistrationRow['status']): Promise<RegistrationRow | null> {
    await getPool().query(
      `UPDATE registrations
       SET status = $2,
           confirmed_at = CASE WHEN $2 = 'CONFIRMED' THEN now() ELSE confirmed_at END,
           cancelled_at = CASE WHEN $2 = 'CANCELLED' THEN now() ELSE cancelled_at END
       WHERE id = $1`,
      [id, status],
    );
    return this.findById(id);
  },
};
