import { getPool } from '../../config/database.js';
import type { SheetsSyncEntityType, SheetsSyncQueueRow } from './sheets-sync.types.js';

export const sheetsSyncRepository = {
  async enqueue(entityType: SheetsSyncEntityType, entityId: string): Promise<SheetsSyncQueueRow> {
    const { rows } = await getPool().query<SheetsSyncQueueRow>(
      `INSERT INTO sheets_sync_queue (entity_type, entity_id, status)
       VALUES ($1, $2, 'PENDING')
       RETURNING *`,
      [entityType, entityId],
    );
    return rows[0]!;
  },

  async listAll(page: number, pageSize: number): Promise<{ rows: SheetsSyncQueueRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<SheetsSyncQueueRow>(
        'SELECT * FROM sheets_sync_queue ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM sheets_sync_queue'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  /** PENDING/RETRYING rows whose next_attempt_at has arrived, oldest first. */
  async listDue(limit: number): Promise<SheetsSyncQueueRow[]> {
    const { rows } = await getPool().query<SheetsSyncQueueRow>(
      `SELECT * FROM sheets_sync_queue
       WHERE status IN ('PENDING', 'RETRYING') AND next_attempt_at <= now()
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit],
    );
    return rows;
  },

  async markSynced(id: string): Promise<void> {
    await getPool().query(
      `UPDATE sheets_sync_queue
       SET status = 'SYNCED', synced_at = now(), last_error = NULL
       WHERE id = $1`,
      [id],
    );
  },

  /** RETRYING while attempts remain, FAILED (terminal) once maxAttempts is reached. */
  async markFailedAttempt(
    id: string,
    reason: string,
    attempts: number,
    maxAttempts: number,
    nextAttemptAt: Date,
  ): Promise<void> {
    const status = attempts >= maxAttempts ? 'FAILED' : 'RETRYING';
    await getPool().query(
      `UPDATE sheets_sync_queue
       SET status = $2, attempts = $3, next_attempt_at = $4, last_error = $5
       WHERE id = $1`,
      [id, status, attempts, nextAttemptAt.toISOString(), reason],
    );
  },
};
