import { getPool } from '../../config/database.js';
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
    tp.benefits AS tp_benefits,
    tp.capacity AS tp_capacity,
    tp.created_at AS tp_created_at,
    tp.updated_at AS tp_updated_at,
    c.id AS c_id,
    c.code AS c_code,
    c.name AS c_name,
    c.discount_type AS c_discount_type,
    c.discount_value AS c_discount_value,
    c.currency AS c_currency,
    c.starts_at AS c_starts_at,
    c.ends_at AS c_ends_at,
    c.max_uses AS c_max_uses,
    c.per_user_limit AS c_per_user_limit,
    c.ticket_plan_id AS c_ticket_plan_id,
    c.min_order_amount AS c_min_order_amount,
    c.max_discount_amount AS c_max_discount_amount,
    c.is_active AS c_is_active,
    c.created_at AS c_created_at,
    c.updated_at AS c_updated_at
  FROM registrations r
  LEFT JOIN ticket_plans tp ON tp.id = r.ticket_plan_id
  LEFT JOIN coupons c ON c.id = r.coupon_id
`;

export const registrationsRepository = {
  /**
   * Creates a PENDING registration for an attendee against a specific
   * ticket plan. The full registration flow (payment, confirmation) is
   * implemented in a later phase -- this establishes the data model +
   * service boundary now, per spec.
   */
  async create(
    attendeeId: string,
    ticketPlanId: string,
    couponId: string | null,
    discountAmount: string,
  ): Promise<RegistrationRow> {
    // Registration ID format (spec #20): "GUNI AWS SCD <event year YY> <NNN>",
    // e.g. "GUNI AWS SCD 26 001". The year comes from the event row itself
    // (not the clock) so registering ahead of the event still tags the
    // right year; the sequence number comes from registration_number_seq
    // (see migration 056) inside this same INSERT so it's one atomic,
    // concurrency-safe statement -- no separate read-then-write race.
    const { rows } = await getPool().query<{ id: string }>(
      `INSERT INTO registrations (attendee_id, registration_number, ticket_plan_id, coupon_id, discount_amount)
       VALUES (
         $1,
         'GUNI AWS SCD ' || to_char((SELECT event_date FROM events ORDER BY created_at DESC LIMIT 1), 'YY')
           || ' ' || lpad(nextval('registration_number_seq')::text, 3, '0'),
         $2, $3, $4
       )
       RETURNING id`,
      [attendeeId, ticketPlanId, couponId, discountAmount],
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

  async list(
    page: number,
    pageSize: number,
    search?: string,
  ): Promise<{ rows: RegistrationRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const where = search && search.trim() ? 'WHERE r.registration_number ILIKE $1' : '';
    const values = search && search.trim() ? [`%${search.trim()}%`] : [];
    const limitIdx = values.length + 1;
    const offsetIdx = values.length + 2;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<RegistrationRow>(
        `${SELECT_WITH_TICKET_PLAN} ${where} ORDER BY r.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        [...values, pageSize, offset],
      ),
      getPool().query<{ count: string }>(
        `SELECT count(*) FROM registrations r ${where}`,
        values,
      ),
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
         c.code AS coupon_code,
         r.discount_amount,
         r.registered_at,
         r.confirmed_at,
         p.status AS payment_status,
         p.amount AS payment_amount,
         p.currency AS payment_currency
       FROM registrations r
       JOIN attendees a ON a.id = r.attendee_id
       JOIN users u ON u.id = a.user_id
       LEFT JOIN ticket_plans tp ON tp.id = r.ticket_plan_id
       LEFT JOIN coupons c ON c.id = r.coupon_id
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
