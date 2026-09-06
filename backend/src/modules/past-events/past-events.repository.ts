import { getPool } from '../../config/database.js';
import { paginatedListQuery, type ListQueryParams } from '../../utils/sql.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { PastEventRow } from './past-events.types.js';
import type { CreatePastEventInput, UpdatePastEventInput } from '@scd/validation';

export const pastEventsRepository = {
  async listPublished(): Promise<PastEventRow[]> {
    const { rows } = await getPool().query<PastEventRow>(
      `SELECT * FROM past_events WHERE status = 'PUBLISHED' ORDER BY year DESC, display_order`,
    );
    return rows;
  },

  async findById(id: string): Promise<PastEventRow | null> {
    const { rows } = await getPool().query<PastEventRow>('SELECT * FROM past_events WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  /** Admin listing — every status. */
  async list(params: ListQueryParams): Promise<{ rows: PastEventRow[]; total: number }> {
    return paginatedListQuery<PastEventRow>(getPool(), {
      table: 'past_events',
      searchColumns: ['event_name', 'session_name', 'location'],
      sortableColumns: { year: 'year', displayOrder: 'display_order', status: 'status' },
      defaultOrderBy: 'year DESC, display_order',
    }, params);
  },

  async create(input: CreatePastEventInput): Promise<PastEventRow> {
    const { rows } = await getPool().query<PastEventRow>(
      `INSERT INTO past_events
         (event_name, year, session_name, session_image, short_description, event_date, location, archive_url, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        input.eventName,
        input.year,
        input.sessionName ?? null,
        input.sessionImage ?? null,
        input.shortDescription ?? null,
        input.eventDate ?? null,
        input.location ?? null,
        input.archiveUrl ?? null,
        input.displayOrder ?? 0,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdatePastEventInput): Promise<PastEventRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      event_name: patch.eventName,
      year: patch.year,
      session_name: patch.sessionName,
      session_image: patch.sessionImage,
      short_description: patch.shortDescription,
      event_date: patch.eventDate,
      location: patch.location,
      archive_url: patch.archiveUrl,
      display_order: patch.displayOrder,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<PastEventRow>(
      `UPDATE past_events SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM past_events WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
