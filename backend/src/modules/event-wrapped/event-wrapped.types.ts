import type { EventWrapped, EventWrappedStatistics } from '@scd/types';

export interface EventWrappedRow {
  id: string;
  attendee_id: string;
  event_id: string;
  statistics: EventWrappedStatistics;
  summary: string | null;
  generated_at: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export function toEventWrapped(row: EventWrappedRow): EventWrapped {
  return {
    id: row.id,
    attendeeId: row.attendee_id,
    eventId: row.event_id,
    statistics: row.statistics,
    summary: row.summary,
    generatedAt: row.generated_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
