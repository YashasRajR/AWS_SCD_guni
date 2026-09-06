import type { SiteLinkKind } from '@scd/types';
import { getPool } from '../../config/database.js';
import { paginatedListQuery, type ListQueryParams } from '../../utils/sql.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { SiteLinkRow } from './site-links.types.js';
import type { CreateSiteLinkInput, UpdateSiteLinkInput } from '@scd/validation';

/**
 * Every method takes `kind` explicitly rather than the module being a
 * per-kind factory -- keeps one plain repository object (like every other
 * module here) while still scoping every query so a NAV route can never
 * read/edit a SOCIAL row or vice versa.
 */
export const siteLinksRepository = {
  async listPublished(kind: SiteLinkKind): Promise<SiteLinkRow[]> {
    const { rows } = await getPool().query<SiteLinkRow>(
      `SELECT * FROM site_links WHERE kind = $1 AND status = 'PUBLISHED' ORDER BY display_order`,
      [kind],
    );
    return rows;
  },

  async findById(kind: SiteLinkKind, id: string): Promise<SiteLinkRow | null> {
    const { rows } = await getPool().query<SiteLinkRow>(
      'SELECT * FROM site_links WHERE id = $1 AND kind = $2',
      [id, kind],
    );
    return rows[0] ?? null;
  },

  /** Admin listing — every status. `kind` is always one of our own two
   * enum literals (never user input), so it's safe as a fixed WHERE
   * fragment per paginatedListQuery's own contract. */
  async list(kind: SiteLinkKind, params: ListQueryParams): Promise<{ rows: SiteLinkRow[]; total: number }> {
    return paginatedListQuery<SiteLinkRow>(
      getPool(),
      {
        table: 'site_links',
        searchColumns: ['label', 'url'],
        sortableColumns: { displayOrder: 'display_order', status: 'status', label: 'label' },
        defaultOrderBy: 'display_order',
        where: `kind = '${kind}'`,
      },
      params,
    );
  },

  async create(kind: SiteLinkKind, input: CreateSiteLinkInput): Promise<SiteLinkRow> {
    const { rows } = await getPool().query<SiteLinkRow>(
      `INSERT INTO site_links (kind, label, url, is_external, open_new_tab, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        kind,
        input.label,
        input.url,
        input.isExternal ?? false,
        input.openNewTab ?? false,
        input.displayOrder ?? 0,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(kind: SiteLinkKind, id: string, patch: UpdateSiteLinkInput): Promise<SiteLinkRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      label: patch.label,
      url: patch.url,
      is_external: patch.isExternal,
      open_new_tab: patch.openNewTab,
      display_order: patch.displayOrder,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(kind, id);
    values.push(id, kind);
    const { rows } = await getPool().query<SiteLinkRow>(
      `UPDATE site_links SET ${setClause} WHERE id = $${nextIndex} AND kind = $${nextIndex + 1} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(kind: SiteLinkKind, id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM site_links WHERE id = $1 AND kind = $2', [id, kind]);
    return (result.rowCount ?? 0) > 0;
  },
};
