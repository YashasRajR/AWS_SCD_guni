import { getPool } from '../../config/database.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { TimelineItemRow } from './timeline.types.js';
import type { CreateTimelineItemInput, UpdateTimelineItemInput } from '@scd/validation';

export const timelineRepository = {
  async listPublished(): Promise<TimelineItemRow[]> {
    const { rows } = await getPool().query<TimelineItemRow>(
      `SELECT * FROM timeline_items WHERE status = 'PUBLISHED' ORDER BY start_time, display_order`,
    );
    return rows;
  },

  async findById(id: string): Promise<TimelineItemRow | null> {
    const { rows } = await getPool().query<TimelineItemRow>(
      'SELECT * FROM timeline_items WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  /** Admin listing — every status. */
  async list(page: number, pageSize: number): Promise<{ rows: TimelineItemRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<TimelineItemRow>(
        'SELECT * FROM timeline_items ORDER BY start_time, display_order LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM timeline_items'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  async create(input: CreateTimelineItemInput): Promise<TimelineItemRow> {
    const { rows } = await getPool().query<TimelineItemRow>(
      `INSERT INTO timeline_items (event_id, title, description, start_time, end_time, type, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.eventId,
        input.title,
        input.description ?? null,
        input.startTime,
        input.endTime ?? null,
        input.type ?? 'OTHER',
        input.displayOrder ?? 0,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateTimelineItemInput): Promise<TimelineItemRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      event_id: patch.eventId,
      title: patch.title,
      description: patch.description,
      start_time: patch.startTime,
      end_time: patch.endTime,
      type: patch.type,
      display_order: patch.displayOrder,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<TimelineItemRow>(
      `UPDATE timeline_items SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM timeline_items WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
