import { getPool } from '../../config/database.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { CheckpointRow } from '../checkpoints/checkpoints.types.js';
import type { CheckpointAttendanceRow } from '../checkpoints/checkpoints.types.js';
import type { VolunteerRow } from './volunteers.types.js';
import type { UpdateVolunteerInput } from '@scd/validation';

/** getHistory's row shape — the raw attendance columns plus the two names the volunteer UI needs to display. */
export interface CheckpointAttendanceWithNamesRow extends CheckpointAttendanceRow {
  attendee_name: string;
  checkpoint_name: string;
}

export const volunteersRepository = {
  async findByUserId(userId: string): Promise<VolunteerRow | null> {
    const { rows } = await getPool().query<VolunteerRow>(
      'SELECT * FROM volunteers WHERE user_id = $1',
      [userId],
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<VolunteerRow | null> {
    const { rows } = await getPool().query<VolunteerRow>('SELECT * FROM volunteers WHERE id = $1', [
      id,
    ]);
    return rows[0] ?? null;
  },

  async create(userId: string, name: string, phone: string | null): Promise<VolunteerRow> {
    const { rows } = await getPool().query<VolunteerRow>(
      `INSERT INTO volunteers (user_id, name, phone) VALUES ($1, $2, $3) RETURNING *`,
      [userId, name, phone],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateVolunteerInput): Promise<VolunteerRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      name: patch.name,
      phone: patch.phone,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<VolunteerRow>(
      `UPDATE volunteers SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  /**
   * Assigns a checkpoint to a volunteer by inserting a fresh ACTIVE row.
   * Idempotent: if this volunteer already has an ACTIVE assignment for
   * this checkpoint, the partial unique index on (volunteer_id,
   * checkpoint_id) WHERE status = 'ACTIVE' makes this a no-op rather than
   * an error. A prior REVOKED row for the same pair, if any, is left
   * alone — the assignment history stays intact.
   */
  async assignCheckpoint(volunteerId: string, checkpointId: string): Promise<void> {
    await getPool().query(
      `INSERT INTO volunteer_checkpoint_assignments (volunteer_id, checkpoint_id, status)
       VALUES ($1, $2, 'ACTIVE')
       ON CONFLICT (volunteer_id, checkpoint_id) WHERE status = 'ACTIVE' DO NOTHING`,
      [volunteerId, checkpointId],
    );
  },

  async revokeCheckpoint(volunteerId: string, checkpointId: string): Promise<boolean> {
    const result = await getPool().query(
      `UPDATE volunteer_checkpoint_assignments SET status = 'REVOKED'
       WHERE volunteer_id = $1 AND checkpoint_id = $2 AND status = 'ACTIVE'`,
      [volunteerId, checkpointId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async listAssignedCheckpoints(volunteerId: string): Promise<CheckpointRow[]> {
    const { rows } = await getPool().query<CheckpointRow>(
      `SELECT c.* FROM checkpoints c
       JOIN volunteer_checkpoint_assignments vca ON vca.checkpoint_id = c.id
       WHERE vca.volunteer_id = $1 AND vca.status = 'ACTIVE'
       ORDER BY c.display_order, c.name`,
      [volunteerId],
    );
    return rows;
  },

  async getHistory(volunteerId: string, limit = 50): Promise<CheckpointAttendanceWithNamesRow[]> {
    const { rows } = await getPool().query<CheckpointAttendanceWithNamesRow>(
      `SELECT ca.*, a.full_name AS attendee_name, c.name AS checkpoint_name
       FROM checkpoint_attendance ca
       JOIN attendees a ON a.id = ca.attendee_id
       JOIN checkpoints c ON c.id = ca.checkpoint_id
       WHERE ca.volunteer_id = $1
       ORDER BY ca.completed_at DESC
       LIMIT $2`,
      [volunteerId, limit],
    );
    return rows;
  },

  async list(page: number, pageSize: number): Promise<{ rows: VolunteerRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<VolunteerRow>(
        'SELECT * FROM volunteers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM volunteers'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },
};
