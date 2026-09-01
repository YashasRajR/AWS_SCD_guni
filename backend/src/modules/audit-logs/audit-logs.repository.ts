import { getPool } from '../../config/database.js';
import type { AuditLogRow, RecordAuditLogInput } from './audit-logs.types.js';

export const auditLogsRepository = {
  /**
   * Fire-and-log: never throws into the caller's flow. Auditing a failed
   * checkpoint-completion attempt should not itself take down the request.
   */
  async record(input: RecordAuditLogInput): Promise<void> {
    await getPool().query(
      `INSERT INTO audit_logs (user_id, role, action, entity_type, entity_id, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.userId,
        input.role,
        input.action,
        input.entityType,
        input.entityId ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ],
    );
  },

  async list(page: number, pageSize: number): Promise<{ rows: AuditLogRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<AuditLogRow>(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM audit_logs'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },
};
