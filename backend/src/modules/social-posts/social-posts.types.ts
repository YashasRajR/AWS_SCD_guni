import type { SocialPost } from '@scd/types';

export interface SocialPostRow {
  id: string;
  attendee_id: string;
  bio: string;
  interests: string[];
  photo_url: string | null;
  linkedin_text: string;
  instagram_text: string;
  hashtags: string[];
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/** eventUrl isn't stored -- it's the current PUBLIC_APP_URL, injected by the
 * service so a post generated before a URL change still links correctly. */
export function toSocialPost(row: SocialPostRow, eventUrl: string): SocialPost {
  return {
    id: row.id,
    attendeeId: row.attendee_id,
    bio: row.bio,
    interests: row.interests,
    photoUrl: row.photo_url,
    linkedinText: row.linkedin_text,
    instagramText: row.instagram_text,
    hashtags: row.hashtags,
    eventUrl,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
