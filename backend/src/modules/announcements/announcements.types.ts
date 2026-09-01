import type { Announcement, AnnouncementPriority, ContentStatus } from '@scd/types';

export interface AnnouncementRow {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  publish_at: string | null;
  expires_at: string | null;
  status: ContentStatus;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
