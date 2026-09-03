import type { EventConfig, EventStatus } from '@scd/types';

export interface EventRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  registration_open: string | null;
  registration_close: string | null;
  status: EventStatus;
  registration_fee: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export function toEventConfig(row: EventRow): EventConfig {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    venue: row.venue,
    registrationOpen: row.registration_open,
    registrationClose: row.registration_close,
    status: row.status,
    registrationFee: row.registration_fee,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
