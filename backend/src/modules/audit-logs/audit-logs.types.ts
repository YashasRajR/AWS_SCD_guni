import type { AuditLog } from '@scd/types';

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface RecordAuditLogInput {
  userId: string | null;
  role: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function toAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}
