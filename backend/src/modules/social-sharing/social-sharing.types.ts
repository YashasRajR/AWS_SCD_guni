import type { SocialContentType, SocialPlatform, SocialShare } from '@scd/types';

export interface SocialShareRow {
  id: string;
  attendee_id: string;
  event_id: string;
  platform: SocialPlatform;
  content_type: SocialContentType;
  shared_at: string;
  created_at: string;
}

export function toSocialShare(row: SocialShareRow): SocialShare {
  return {
    id: row.id,
    attendeeId: row.attendee_id,
    eventId: row.event_id,
    platform: row.platform,
    contentType: row.content_type,
    sharedAt: row.shared_at,
    createdAt: row.created_at,
  };
}
