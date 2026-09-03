import { getPool } from '../../config/database.js';
import { paginatedListQuery, type ListQueryParams } from '../../utils/sql.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { AgendaItemRow } from './agenda.types.js';
import type { CreateAgendaItemInput, UpdateAgendaItemInput } from '@scd/validation';

export const agendaRepository = {
  async listPublished(): Promise<AgendaItemRow[]> {
    const { rows } = await getPool().query<AgendaItemRow>(
      `SELECT * FROM agenda_items WHERE status = 'PUBLISHED' ORDER BY start_time, display_order`,
    );
    return rows;
  },

  async findById(id: string): Promise<AgendaItemRow | null> {
    const { rows } = await getPool().query<AgendaItemRow>(
      'SELECT * FROM agenda_items WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  /** Admin listing — every status. */
  async list(params: ListQueryParams): Promise<{ rows: AgendaItemRow[]; total: number }> {
    return paginatedListQuery<AgendaItemRow>(getPool(), {
      table: 'agenda_items',
      searchColumns: ['title'],
      sortableColumns: { title: 'title', startTime: 'start_time', displayOrder: 'display_order', status: 'status' },
      defaultOrderBy: 'start_time, display_order',
    }, params);
  },

  async create(input: CreateAgendaItemInput): Promise<AgendaItemRow> {
    const { rows } = await getPool().query<AgendaItemRow>(
      `INSERT INTO agenda_items (event_id, session_id, title, start_time, end_time, venue_id, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.eventId,
        input.sessionId ?? null,
        input.title,
        input.startTime,
        input.endTime,
        input.venueId ?? null,
        input.displayOrder ?? 0,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateAgendaItemInput): Promise<AgendaItemRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      event_id: patch.eventId,
      session_id: patch.sessionId,
      title: patch.title,
      start_time: patch.startTime,
      end_time: patch.endTime,
      venue_id: patch.venueId,
      display_order: patch.displayOrder,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<AgendaItemRow>(
      `UPDATE agenda_items SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM agenda_items WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
