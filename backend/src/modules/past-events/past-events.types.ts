import type { ContentStatus, PastEvent } from '@scd/types';

export interface PastEventRow {
  id: string;
  event_name: string;
  year: number;
  session_name: string | null;
  session_image: string | null;
  short_description: string | null;
  event_date: string | null;
  location: string | null;
  archive_url: string | null;
  display_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export function toPastEvent(row: PastEventRow): PastEvent {
  return {
    id: row.id,
    eventName: row.event_name,
    year: row.year,
    sessionName: row.session_name,
    sessionImage: row.session_image,
    shortDescription: row.short_description,
    eventDate: row.event_date,
    location: row.location,
    archiveUrl: row.archive_url,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
