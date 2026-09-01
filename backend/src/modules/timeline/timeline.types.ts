import type { ContentStatus, TimelineItem, TimelineItemType } from '@scd/types';

export interface TimelineItemRow {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  type: TimelineItemType;
  display_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export function toTimelineItem(row: TimelineItemRow): TimelineItem {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    type: row.type,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
