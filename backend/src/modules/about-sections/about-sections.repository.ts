import { getPool } from '../../config/database.js';
import { paginatedListQuery, buildUpdateSet, type ListQueryParams } from '../../utils/sql.js';
import type { AboutSectionRow } from './about-sections.types.js';
import type { CreateAboutSectionInput, UpdateAboutSectionInput } from '@scd/validation';

export const aboutSectionsRepository = {
  async listPublished(): Promise<AboutSectionRow[]> {
    const { rows } = await getPool().query<AboutSectionRow>(
      `SELECT * FROM about_sections WHERE status = 'PUBLISHED' ORDER BY display_order`,
    );
    return rows;
  },

  async findById(id: string): Promise<AboutSectionRow | null> {
    const { rows } = await getPool().query<AboutSectionRow>('SELECT * FROM about_sections WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  /** Admin listing — every status. */
  async list(params: ListQueryParams): Promise<{ rows: AboutSectionRow[]; total: number }> {
    return paginatedListQuery<AboutSectionRow>(
      getPool(),
      {
        table: 'about_sections',
        searchColumns: ['title'],
        sortableColumns: { title: 'title', displayOrder: 'display_order', status: 'status' },
        defaultOrderBy: 'display_order',
      },
      params,
    );
  },

  async create(input: CreateAboutSectionInput): Promise<AboutSectionRow> {
    const { rows } = await getPool().query<AboutSectionRow>(
      `INSERT INTO about_sections (title, body, image_url, link_url, link_label, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.title,
        input.body,
        input.imageUrl ?? null,
        input.linkUrl ?? null,
        input.linkLabel ?? null,
        input.displayOrder ?? 0,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateAboutSectionInput): Promise<AboutSectionRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      title: patch.title,
      body: patch.body,
      image_url: patch.imageUrl,
      link_url: patch.linkUrl,
      link_label: patch.linkLabel,
      display_order: patch.displayOrder,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<AboutSectionRow>(
      `UPDATE about_sections SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM about_sections WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
