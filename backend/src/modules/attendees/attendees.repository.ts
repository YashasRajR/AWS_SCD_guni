import type { Pool, PoolClient } from 'pg';
import { getPool } from '../../config/database.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type {
  AttendeeExportRow,
  AttendeeRow,
  CreateAttendeeInput,
  UpdateAttendeeInput,
} from './attendees.types.js';

/** Accepts either the shared pool or a transaction client — see
 * users.repository.ts's Queryable for why. */
type Queryable = Pool | PoolClient;

export const attendeesRepository = {
  async create(input: CreateAttendeeInput, db: Queryable = getPool()): Promise<AttendeeRow> {
    const { rows } = await db.query<AttendeeRow>(
      `INSERT INTO attendees (user_id, full_name, phone, university, department, year, registration_type, linkedin_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.userId,
        input.fullName,
        input.phone ?? null,
        input.university ?? null,
        input.department ?? null,
        input.year ?? null,
        input.registrationType ?? null,
        input.linkedinUrl ?? null,
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
       WHERE a.deleted_at IS NULL
         AND (a.full_name ILIKE $1
          OR u.email ILIKE $1
          OR r.registration_number ILIKE $1)
       GROUP BY a.id
       ORDER BY a.full_name
       LIMIT $2`,
      [`%${query}%`, limit],
    );
    return rows;
  },

  /** Full attendee + registration join for the admin CSV export — see
   * registrations.repository.ts's listForExport() for the same pattern. */
  async listForExport(): Promise<AttendeeExportRow[]> {
    const { rows } = await getPool().query<AttendeeExportRow>(
      `SELECT
         a.full_name,
         u.email,
         a.phone,
         a.university,
         a.department,
         a.year,
         a.registration_type,
         r.registration_number,
         r.status AS registration_status,
         a.created_at
       FROM attendees a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN registrations r ON r.attendee_id = a.id
       WHERE a.deleted_at IS NULL
       ORDER BY a.created_at DESC`,
    );
    return rows;
  },

  /** Admin listing — optional search across name/email/registration number, same
   * columns the volunteer-facing search() above already matches against. */
  async list(
    page: number,
    pageSize: number,
    search?: string,
    archived = false,
  ): Promise<{ rows: AttendeeRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const values: unknown[] = [];
    const conditions = [archived ? 'a.deleted_at IS NOT NULL' : 'a.deleted_at IS NULL'];
    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push('(a.full_name ILIKE $1 OR u.email ILIKE $1 OR r.registration_number ILIKE $1)');
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

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

  async update(id: string, patch: UpdateAttendeeInput): Promise<AttendeeRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      full_name: patch.fullName,
      phone: patch.phone,
      university: patch.university,
      department: patch.department,
      year: patch.year,
      registration_type: patch.registrationType,
      linkedin_url: patch.linkedinUrl,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<AttendeeRow>(
      `UPDATE attendees SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  /** Soft-delete (spec #34/#55) -- excluded from list/search/export from then on. */
  async archive(id: string): Promise<AttendeeRow | null> {
    const { rows } = await getPool().query<AttendeeRow>(
      `UPDATE attendees SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  },

  async restore(id: string): Promise<AttendeeRow | null> {
    const { rows } = await getPool().query<AttendeeRow>(
      `UPDATE attendees SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  },
};
