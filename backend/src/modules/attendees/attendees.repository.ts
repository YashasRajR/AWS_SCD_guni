import type { Pool, PoolClient } from 'pg';
import { getPool } from '../../config/database.js';
import type { AttendeeRow, CreateAttendeeInput } from './attendees.types.js';

/** Accepts either the shared pool or a transaction client — see
 * users.repository.ts's Queryable for why. */
type Queryable = Pool | PoolClient;

export const attendeesRepository = {
  async create(input: CreateAttendeeInput, db: Queryable = getPool()): Promise<AttendeeRow> {
    const { rows } = await db.query<AttendeeRow>(
      `INSERT INTO attendees (user_id, full_name, phone, university, department, year, registration_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.userId,
        input.fullName,
        input.phone ?? null,
        input.university ?? null,
        input.department ?? null,
        input.year ?? null,
        input.registrationType ?? null,
      ],
    );
    return rows[0]!;
  },

  async findByUserId(userId: string): Promise<AttendeeRow | null> {
    const { rows } = await getPool().query<AttendeeRow>(
      'SELECT * FROM attendees WHERE user_id = $1',
      [userId],
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<AttendeeRow | null> {
    const { rows } = await getPool().query<AttendeeRow>('SELECT * FROM attendees WHERE id = $1', [
      id,
    ]);
    return rows[0] ?? null;
  },

  /** Used by the volunteer attendee-lookup flow — name, or joined registration number/email. */
  async search(query: string, limit = 20): Promise<AttendeeRow[]> {
    const { rows } = await getPool().query<AttendeeRow>(
      `SELECT a.* FROM attendees a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN registrations r ON r.attendee_id = a.id
       WHERE a.full_name ILIKE $1
          OR u.email ILIKE $1
          OR r.registration_number ILIKE $1
       GROUP BY a.id
       ORDER BY a.full_name
       LIMIT $2`,
      [`%${query}%`, limit],
    );
    return rows;
  },

  /** Admin listing — optional search across name/email/registration number, same
   * columns the volunteer-facing search() above already matches against. */
  async list(
    page: number,
    pageSize: number,
    search?: string,
  ): Promise<{ rows: AttendeeRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const values: unknown[] = [];
    let where = '';
    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      where = `WHERE a.full_name ILIKE $1 OR u.email ILIKE $1 OR r.registration_number ILIKE $1`;
    }

    const baseFrom = `FROM attendees a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN registrations r ON r.attendee_id = a.id
       ${where}`;

    const countRes = await getPool().query<{ count: string }>(
      `SELECT COUNT(DISTINCT a.id)::text AS count ${baseFrom}`,
      values,
    );

    const limitIdx = values.length + 1;
    const offsetIdx = values.length + 2;
    const { rows } = await getPool().query<AttendeeRow>(
      `SELECT DISTINCT a.* ${baseFrom}
       ORDER BY a.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...values, pageSize, offset],
    );
    return { rows, total: Number(countRes.rows[0]?.count ?? 0) };
  },
};
