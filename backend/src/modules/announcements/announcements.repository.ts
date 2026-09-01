import { getPool } from '../../config/database.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { AnnouncementRow } from './announcements.types.js';
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from '@scd/validation';

export const announcementsRepository = {
  /** Published, not yet expired, and already past its publish time (if set). */
  async listActive(): Promise<AnnouncementRow[]> {
    const { rows } = await getPool().query<AnnouncementRow>(
      `SELECT * FROM announcements
       WHERE status = 'PUBLISHED'
         AND (publish_at IS NULL OR publish_at <= now())
         AND (expires_at IS NULL OR expires_at > now())
       ORDER BY priority DESC, created_at DESC`,
    );
    return rows;
  },

  async findById(id: string): Promise<AnnouncementRow | null> {
    const { rows } = await getPool().query<AnnouncementRow>(
      'SELECT * FROM announcements WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  /** Admin listing — every status, regardless of publish/expiry window. */
  async list(page: number, pageSize: number): Promise<{ rows: AnnouncementRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<AnnouncementRow>(
        'SELECT * FROM announcements ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM announcements'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  async create(input: CreateAnnouncementInput): Promise<AnnouncementRow> {
    const { rows } = await getPool().query<AnnouncementRow>(
      `INSERT INTO announcements (title, message, priority, publish_at, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.title,
        input.message,
        input.priority ?? 'NORMAL',
        input.publishAt ?? null,
        input.expiresAt ?? null,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateAnnouncementInput): Promise<AnnouncementRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      title: patch.title,
      message: patch.message,
      priority: patch.priority,
      publish_at: patch.publishAt,
      expires_at: patch.expiresAt,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<AnnouncementRow>(
      `UPDATE announcements SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM announcements WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
