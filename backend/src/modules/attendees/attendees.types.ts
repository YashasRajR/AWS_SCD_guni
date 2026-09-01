import type { Attendee } from '@scd/types';

export interface AttendeeRow {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  university: string | null;
  department: string | null;
  year: string | null;
  profile_image: string | null;
  registration_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAttendeeInput {
  userId: string;
  fullName: string;
  phone?: string;
  university?: string;
  department?: string;
  year?: string;
  registrationType?: string;
}

export function toAttendee(row: AttendeeRow): Attendee {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    university: row.university,
    department: row.department,
    year: row.year,
    profileImage: row.profile_image,
    registrationType: row.registration_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
