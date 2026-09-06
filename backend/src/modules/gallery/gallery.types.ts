import type { ContentStatus, GalleryItem } from '@scd/types';

export interface GalleryItemRow {
  id: string;
  image_url: string;
  caption: string | null;
  alt_text: string | null;
  category: string | null;
  event_year: number | null;
  session_id: string | null;
  display_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export function toGalleryItem(row: GalleryItemRow): GalleryItem {
  return {
    id: row.id,
    imageUrl: row.image_url,
    caption: row.caption,
    altText: row.alt_text,
    category: row.category,
    eventYear: row.event_year,
    sessionId: row.session_id,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
