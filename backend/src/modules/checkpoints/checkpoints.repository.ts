import { getPool } from '../../config/database.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { CheckpointAttendanceExportRow, CheckpointAttendanceRow, CheckpointRow } from './checkpoints.types.js';
import type { CreateCheckpointInput, UpdateCheckpointInput } from '@scd/validation';

export const checkpointsRepository = {
  async listByEvent(eventId: string): Promise<CheckpointRow[]> {
    const { rows } = await getPool().query<CheckpointRow>(
      `SELECT * FROM checkpoints WHERE event_id = $1 AND status = 'PUBLISHED' ORDER BY display_order, name`,
      [eventId],
    );
    return rows;
  },

  async list(page: number, pageSize: number): Promise<{ rows: CheckpointRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<CheckpointRow>(
        'SELECT * FROM checkpoints ORDER BY display_order, name LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM checkpoints'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  /** Full attendee + checkpoint + volunteer join for the admin CSV export —
   * same pattern as registrations.repository.ts's listForExport(). */
  async listAttendanceForExport(): Promise<CheckpointAttendanceExportRow[]> {
    const { rows } = await getPool().query<CheckpointAttendanceExportRow>(
      `SELECT
         c.name AS checkpoint_name,
         a.full_name AS attendee_name,
         u.email AS attendee_email,
         v.name AS volunteer_name,
         ca.status,
         ca.completed_at
       FROM checkpoint_attendance ca
       JOIN checkpoints c ON c.id = ca.checkpoint_id
       JOIN attendees a ON a.id = ca.attendee_id
       JOIN users u ON u.id = a.user_id
       LEFT JOIN volunteers v ON v.id = ca.volunteer_id
       ORDER BY ca.completed_at DESC`,
    );
    return rows;
  },

  async findById(id: string): Promise<CheckpointRow | null> {
    const { rows } = await getPool().query<CheckpointRow>(
      'SELECT * FROM checkpoints WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  async hasActiveAssignment(volunteerId: string, checkpointId: string): Promise<boolean> {
    const { rows } = await getPool().query(
      `SELECT 1 FROM volunteer_checkpoint_assignments
       WHERE volunteer_id = $1 AND checkpoint_id = $2 AND status = 'ACTIVE'`,
      [volunteerId, checkpointId],
    );
    return rows.length > 0;
  },

  async findCompletedAttendance(
    attendeeId: string,
    checkpointId: string,
  ): Promise<CheckpointAttendanceRow | null> {
    const { rows } = await getPool().query<CheckpointAttendanceRow>(
      `SELECT * FROM checkpoint_attendance
       WHERE attendee_id = $1 AND checkpoint_id = $2 AND status = 'COMPLETED'`,
      [attendeeId, checkpointId],
    );
    return rows[0] ?? null;
  },

  async createAttendance(
    attendeeId: string,
    checkpointId: string,
    volunteerId: string,
  ): Promise<CheckpointAttendanceRow> {
    const { rows } = await getPool().query<CheckpointAttendanceRow>(
      `INSERT INTO checkpoint_attendance (attendee_id, checkpoint_id, volunteer_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [attendeeId, checkpointId, volunteerId],
    );
    return rows[0]!;
  },

  async getAttendeeCompletions(attendeeId: string, eventId: string): Promise<CheckpointAttendanceRow[]> {
    const { rows } = await getPool().query<CheckpointAttendanceRow>(
      `SELECT ca.* FROM checkpoint_attendance ca
       JOIN checkpoints c ON c.id = ca.checkpoint_id
       WHERE ca.attendee_id = $1 AND c.event_id = $2 AND ca.status = 'COMPLETED'`,
      [attendeeId, eventId],
    );
    return rows;
  },

  async findAttendanceById(id: string): Promise<CheckpointAttendanceRow | null> {
    const { rows } = await getPool().query<CheckpointAttendanceRow>(
      'SELECT * FROM checkpoint_attendance WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  /**
   * Correction path for a mis-recorded attendance: flips COMPLETED ->
   * REVERSED rather than deleting the row, so the history stays auditable
   * (see docs/architecture/domain-and-data-model.md §5 — attendance is
   * never hard-deleted). The WHERE status = 'COMPLETED' guard makes this
   * idempotent/safe against double-reversal and against reversing a row
   * that was never completed in the first place.
   */
  async reverseAttendance(id: string): Promise<CheckpointAttendanceRow | null> {
    const { rows } = await getPool().query<CheckpointAttendanceRow>(
      `UPDATE checkpoint_attendance SET status = 'REVERSED'
       WHERE id = $1 AND status = 'COMPLETED'
       RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  },

  async create(input: CreateCheckpointInput): Promise<CheckpointRow> {
    const { rows } = await getPool().query<CheckpointRow>(
      `INSERT INTO checkpoints (event_id, name, description, location, start_time, end_time, display_order, is_required)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.eventId,
        input.name,
        input.description ?? null,
        input.location ?? null,
        input.startTime ?? null,
        input.endTime ?? null,
        input.displayOrder ?? 0,
        input.isRequired ?? false,
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateCheckpointInput): Promise<CheckpointRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      event_id: patch.eventId,
      name: patch.name,
      description: patch.description,
      location: patch.location,
      start_time: patch.startTime,
      end_time: patch.endTime,
      display_order: patch.displayOrder,
      is_required: patch.isRequired,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<CheckpointRow>(
      `UPDATE checkpoints SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM checkpoints WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
