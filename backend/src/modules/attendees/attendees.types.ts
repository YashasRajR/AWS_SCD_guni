import type { Attendee } from '@scd/types';

export interface AttendeeRow {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  university: string | null;
  department: string | null;
  branch: string | null;
  year: string | null;
  date_of_birth: string | null;
  company_name: string | null;
  designation: string | null;
  profile_image: string | null;
  registration_type: string | null;
  linkedin_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateAttendeeInput {
  fullName?: string;
  phone?: string;
  university?: string;
  department?: string;
  branch?: string;
  year?: string;
  dateOfBirth?: string;
  companyName?: string;
  designation?: string;
  registrationType?: string;
  linkedinUrl?: string;
}

export interface CreateAttendeeInput {
  userId: string;
  fullName: string;
  phone?: string;
  university?: string;
  department?: string;
  branch?: string;
  year?: string;
  dateOfBirth?: string;
  companyName?: string;
  designation?: string;
  registrationType?: string;
  linkedinUrl?: string;
}

export interface AttendeeExportRow {
  full_name: string;
  email: string;
  phone: string | null;
  university: string | null;
  department: string | null;
  year: string | null;
  registration_type: string | null;
  registration_number: string | null;
  registration_status: string | null;
  created_at: string;
}

export function toAttendee(row: AttendeeRow): Attendee {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    university: row.university,
    department: row.department,
    branch: row.branch,
    year: row.year,
    dateOfBirth: row.date_of_birth,
    companyName: row.company_name,
    designation: row.designation,
    profileImage: row.profile_image,
    registrationType: row.registration_type,
    linkedinUrl: row.linkedin_url,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
