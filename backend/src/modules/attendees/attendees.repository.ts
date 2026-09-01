import { getPool } from '../../config/database.js';
import type { AttendeeRow, CreateAttendeeInput } from './attendees.types.js';

export const attendeesRepository = {
  async create(input: CreateAttendeeInput): Promise<AttendeeRow> {
    const { rows } = await getPool().query<AttendeeRow>(
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

  async list(page: number, pageSize: number): Promise<{ rows: AttendeeRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<AttendeeRow>(
        'SELECT * FROM attendees ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM attendees'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },
};
