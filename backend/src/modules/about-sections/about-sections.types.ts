import type { AboutSection, ContentStatus } from '@scd/types';

export interface AboutSectionRow {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  display_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export function toAboutSection(row: AboutSectionRow): AboutSection {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    linkLabel: row.link_label,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
