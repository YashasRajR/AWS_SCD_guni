import type { Volunteer, VolunteerStatus } from '@scd/types';

export interface VolunteerRow {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  status: VolunteerStatus;
  created_at: string;
  updated_at: string;
}

export function toVolunteer(row: VolunteerRow): Volunteer {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
