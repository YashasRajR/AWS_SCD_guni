import type { Registration, RegistrationStatus } from '@scd/types';

export interface RegistrationRow {
  id: string;
  attendee_id: string;
  registration_number: string;
  status: RegistrationStatus;
  registered_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toRegistration(row: RegistrationRow): Registration {
  return {
    id: row.id,
    attendeeId: row.attendee_id,
    registrationNumber: row.registration_number,
    status: row.status,
    registeredAt: row.registered_at,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
