import { getPool } from '../../config/database.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { AchievementRow, AttendeeAchievementRow } from './achievements.types.js';

export const achievementsRepository = {
  async listUnlockedForAttendee(attendeeId: string): Promise<AttendeeAchievementRow[]> {
    const { rows } = await getPool().query<AttendeeAchievementRow>(
      `SELECT * FROM attendee_achievements WHERE attendee_id = $1 ORDER BY unlocked_at DESC`,
      [attendeeId],
    );
    return rows;
  },

  async list(page?: number, pageSize?: number): Promise<{ rows: AchievementRow[]; total: number }> {
    if (page !== undefined && pageSize !== undefined) {
      const offset = (page - 1) * pageSize;
      const [{ rows }, countResult] = await Promise.all([
        getPool().query<AchievementRow>(
          'SELECT * FROM achievements ORDER BY display_order, name LIMIT $1 OFFSET $2',
          [pageSize, offset],
        ),
        getPool().query<{ count: string }>('SELECT count(*) FROM achievements'),
      ]);
      return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
    }
    const { rows } = await getPool().query<AchievementRow>(
      'SELECT * FROM achievements ORDER BY display_order, name',
    );
    return { rows, total: rows.length };
  },

  async listPublished(): Promise<AchievementRow[]> {
    const { rows } = await getPool().query<AchievementRow>(
      `SELECT * FROM achievements WHERE status = 'PUBLISHED' ORDER BY display_order, name`,
    );
    return rows;
  },

  async findById(id: string): Promise<AchievementRow | null> {
    const { rows } = await getPool().query<AchievementRow>(
      'SELECT * FROM achievements WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  async create(input: Record<string, unknown>): Promise<AchievementRow> {
    const { rows } = await getPool().query<AchievementRow>(
      `INSERT INTO achievements (name, slug, description, icon_url, condition_type, condition_config, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.name,
        input.slug,
        input.description ?? null,
        input.iconUrl ?? null,
        input.conditionType ?? 'MANUAL',
        input.conditionConfig ? JSON.stringify(input.conditionConfig) : null,
        input.displayOrder ?? 0,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: Record<string, unknown>): Promise<AchievementRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      name: patch.name,
      slug: patch.slug,
      description: patch.description,
      icon_url: patch.iconUrl,
      condition_type: patch.conditionType,
      condition_config: patch.conditionConfig ? JSON.stringify(patch.conditionConfig) : undefined,
      display_order: patch.displayOrder,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<AchievementRow>(
      `UPDATE achievements SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM achievements WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async hasUnlocked(attendeeId: string, achievementId: string): Promise<boolean> {
    const { rows } = await getPool().query(
      `SELECT 1 FROM attendee_achievements WHERE attendee_id = $1 AND achievement_id = $2`,
      [attendeeId, achievementId],
    );
    return rows.length > 0;
  },

  async unlock(attendeeId: string, achievementId: string): Promise<void> {
    await getPool().query(
      `INSERT INTO attendee_achievements (attendee_id, achievement_id)
       VALUES ($1, $2)
       ON CONFLICT (attendee_id, achievement_id) DO NOTHING`,
      [attendeeId, achievementId],
    );
  },
};
