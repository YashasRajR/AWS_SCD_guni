import { getPool } from '../../config/database.js';
import type { AuditLogRow, RecordAuditLogInput } from './audit-logs.types.js';

export const auditLogsRepository = {
  /**
   * Fire-and-log: never throws into the caller's flow. Auditing a failed
   * admin action attempt should not itself take down the request.
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

  /**
   * Cross-entity activity history for the admin attendee-detail page
   * (spec #34) -- an attendee's own audit trail plus their
   * registration/ticket/invoice ids, so a ticket reissue or a
   * registration status change shows up on the attendee's timeline
   * without a separate audit_logs table per entity. Capped at 200 rows;
   * this is a detail-page timeline, not an export.
   */
  async listForEntities(pairs: { entityType: string; entityId: string }[]): Promise<AuditLogRow[]> {
    if (pairs.length === 0) return [];
    const values = pairs.flatMap((p) => [p.entityType, p.entityId]);
    const tuples = pairs.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    const { rows } = await getPool().query<AuditLogRow>(
      `SELECT * FROM audit_logs WHERE (entity_type, entity_id) IN (${tuples}) ORDER BY created_at DESC LIMIT 200`,
      values,
    );
    return rows;
  },
};
