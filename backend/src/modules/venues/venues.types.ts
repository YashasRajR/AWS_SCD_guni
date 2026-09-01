import type { ContentStatus, Venue } from '@scd/types';

export interface VenueRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  location: string | null;
  room: string | null;
  capacity: number | null;
  map_url: string | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export function toVenue(row: VenueRow): Venue {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    description: row.description,
    location: row.location,
    room: row.room,
    capacity: row.capacity,
    mapUrl: row.map_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
