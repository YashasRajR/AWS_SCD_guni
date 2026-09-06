import type { ContentStatus, SiteLink, SiteLinkKind } from '@scd/types';

export interface SiteLinkRow {
  id: string;
  kind: SiteLinkKind;
  label: string;
  url: string;
  is_external: boolean;
  open_new_tab: boolean;
  display_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export function toSiteLink(row: SiteLinkRow): SiteLink {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    url: row.url,
    isExternal: row.is_external,
    openNewTab: row.open_new_tab,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
