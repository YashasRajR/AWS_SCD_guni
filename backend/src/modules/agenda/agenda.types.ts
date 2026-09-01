import type { AgendaItem, ContentStatus, Session, Venue } from '@scd/types';

export interface AgendaItemRow {
  id: string;
  event_id: string;
  session_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  venue_id: string | null;
  display_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export function toAgendaItem(row: AgendaItemRow, session?: Session, venue?: Venue): AgendaItem {
  return {
    id: row.id,
    eventId: row.event_id,
    sessionId: row.session_id,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    venueId: row.venue_id,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    session,
    venue,
  };
}
