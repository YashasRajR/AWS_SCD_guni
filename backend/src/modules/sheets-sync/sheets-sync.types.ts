export type SheetsSyncStatus = 'PENDING' | 'RETRYING' | 'SYNCED' | 'FAILED';
export type SheetsSyncEntityType = 'REGISTRATION';

export interface SheetsSyncQueueRow {
  id: string;
  entity_type: SheetsSyncEntityType;
  entity_id: string;
  status: SheetsSyncStatus;
  attempts: number;
  next_attempt_at: string;
  last_error: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SheetsSyncQueueItem {
  id: string;
  entityType: SheetsSyncEntityType;
  entityId: string;
  status: SheetsSyncStatus;
  attempts: number;
  lastError: string | null;
  syncedAt: string | null;
  createdAt: string;
}

export function toSheetsSyncQueueItem(row: SheetsSyncQueueRow): SheetsSyncQueueItem {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status,
    attempts: row.attempts,
    lastError: row.last_error,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
  };
}
