import { getPool } from '../../config/database.js';
import { paginatedListQuery, type ListQueryParams } from '../../utils/sql.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { VenueRow } from './venues.types.js';
import type { CreateVenueInput, UpdateVenueInput } from '@scd/validation';

export const venuesRepository = {
  async listPublished(): Promise<VenueRow[]> {
    const { rows } = await getPool().query<VenueRow>(
      `SELECT * FROM venues WHERE status = 'PUBLISHED' ORDER BY name`,
    );
    return rows;
  },
  async findById(id: string): Promise<VenueRow | null> {
    const { rows } = await getPool().query<VenueRow>('SELECT * FROM venues WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  /** Admin listing — every status. */
  async list(params: ListQueryParams): Promise<{ rows: VenueRow[]; total: number }> {
    return paginatedListQuery<VenueRow>(getPool(), {
      table: 'venues',
      searchColumns: ['name', 'location', 'room'],
      sortableColumns: { name: 'name', capacity: 'capacity', status: 'status' },
      defaultOrderBy: 'name',
    }, params);
  },

  async create(input: CreateVenueInput): Promise<VenueRow> {
    const { rows } = await getPool().query<VenueRow>(
      `INSERT INTO venues (event_id, name, description, location, room, capacity, map_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.eventId,
        input.name,
        input.description ?? null,
        input.location ?? null,
        input.room ?? null,
        input.capacity ?? null,
        input.mapUrl ?? null,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateVenueInput): Promise<VenueRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      event_id: patch.eventId,
      name: patch.name,
      description: patch.description,
      location: patch.location,
      room: patch.room,
      capacity: patch.capacity,
      map_url: patch.mapUrl,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<VenueRow>(
      `UPDATE venues SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM venues WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
