import type { Announcement, AnnouncementAudience, AnnouncementPriority, ContentStatus, DisplayFrequency } from '@scd/types';

export interface AnnouncementRow {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  publish_at: string | null;
  expires_at: string | null;
  status: ContentStatus;
  image_url: string | null;
  button_label: string | null;
  button_url: string | null;
  show_as_popup: boolean;
  display_frequency: DisplayFrequency;
  target_audience: AnnouncementAudience;
  created_at: string;
  updated_at: string;
}

export function toAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    priority: row.priority,
    publishAt: row.publish_at,
    expiresAt: row.expires_at,
    status: row.status,
    imageUrl: row.image_url,
    buttonLabel: row.button_label,
    buttonUrl: row.button_url,
    showAsPopup: row.show_as_popup,
    displayFrequency: row.display_frequency,
    targetAudience: row.target_audience,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
