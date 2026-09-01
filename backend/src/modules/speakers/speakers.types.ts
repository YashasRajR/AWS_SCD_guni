import type { ContentStatus, Speaker } from '@scd/types';

export interface SpeakerRow {
  id: string;
  name: string;
  designation: string | null;
  organization: string | null;
  bio: string | null;
  profile_image: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  display_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export function toSpeaker(row: SpeakerRow): Speaker {
  return {
    id: row.id,
    name: row.name,
    designation: row.designation,
    organization: row.organization,
    bio: row.bio,
    profileImage: row.profile_image,
    linkedinUrl: row.linkedin_url,
    websiteUrl: row.website_url,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
