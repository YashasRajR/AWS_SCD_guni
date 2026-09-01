import { getPool } from '../../config/database.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { EventRow } from './event.types.js';
import type { CreateEventInput, UpdateEventInput } from '@scd/validation';

export const eventRepository = {
  /**
   * The platform is built to support future editions, but for now there is
   * one current event: the most recently created PUBLISHED one.
   */
  async getCurrent(): Promise<EventRow | null> {
    const { rows } = await getPool().query<EventRow>(
      `SELECT * FROM events WHERE status = 'PUBLISHED' ORDER BY event_date DESC LIMIT 1`,
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<EventRow | null> {
    const { rows } = await getPool().query<EventRow>('SELECT * FROM events WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  /** Admin listing — every status, not just PUBLISHED. */
  async list(page: number, pageSize: number): Promise<{ rows: EventRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<EventRow>(
        'SELECT * FROM events ORDER BY event_date DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM events'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  async create(input: CreateEventInput): Promise<EventRow> {
    const { rows } = await getPool().query<EventRow>(
      `INSERT INTO events
         (name, slug, description, event_date, start_time, end_time, venue, registration_open, registration_close, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        input.name,
        input.slug,
        input.description ?? null,
        input.eventDate,
        input.startTime ?? null,
        input.endTime ?? null,
        input.venue ?? null,
        input.registrationOpen ?? null,
        input.registrationClose ?? null,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateEventInput): Promise<EventRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      name: patch.name,
      slug: patch.slug,
      description: patch.description,
      event_date: patch.eventDate,
      start_time: patch.startTime,
      end_time: patch.endTime,
      venue: patch.venue,
      registration_open: patch.registrationOpen,
      registration_close: patch.registrationClose,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<EventRow>(
      `UPDATE events SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM events WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
