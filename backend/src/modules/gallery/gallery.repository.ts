import { getPool } from '../../config/database.js';
import { paginatedListQuery, type ListQueryParams } from '../../utils/sql.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { GalleryItemRow } from './gallery.types.js';
import type { CreateGalleryItemInput, UpdateGalleryItemInput } from '@scd/validation';

export const galleryRepository = {
  async listPublished(): Promise<GalleryItemRow[]> {
    const { rows } = await getPool().query<GalleryItemRow>(
      `SELECT * FROM gallery_items WHERE status = 'PUBLISHED' ORDER BY category, display_order`,
    );
    return rows;
  },

  async findById(id: string): Promise<GalleryItemRow | null> {
    const { rows } = await getPool().query<GalleryItemRow>('SELECT * FROM gallery_items WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  /** Admin listing — every status. */
  async list(params: ListQueryParams): Promise<{ rows: GalleryItemRow[]; total: number }> {
    return paginatedListQuery<GalleryItemRow>(getPool(), {
      table: 'gallery_items',
      searchColumns: ['caption', 'category'],
      sortableColumns: { category: 'category', displayOrder: 'display_order', status: 'status', eventYear: 'event_year' },
      defaultOrderBy: 'category, display_order',
    }, params);
  },

  async create(input: CreateGalleryItemInput): Promise<GalleryItemRow> {
    const { rows } = await getPool().query<GalleryItemRow>(
      `INSERT INTO gallery_items (image_url, caption, alt_text, category, event_year, session_id, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.imageUrl,
        input.caption ?? null,
        input.altText ?? null,
        input.category ?? null,
        input.eventYear ?? null,
        input.sessionId ?? null,
        input.displayOrder ?? 0,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateGalleryItemInput): Promise<GalleryItemRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      image_url: patch.imageUrl,
      caption: patch.caption,
      alt_text: patch.altText,
      category: patch.category,
      event_year: patch.eventYear,
      session_id: patch.sessionId,
      display_order: patch.displayOrder,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<GalleryItemRow>(
      `UPDATE gallery_items SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM gallery_items WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
