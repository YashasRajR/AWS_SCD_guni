import type { SiteLink } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<SiteLink>[] = [
  { key: 'label', label: 'Platform', render: (r) => r.label },
  { key: 'url', label: 'URL', render: (r) => r.url },
  { key: 'displayOrder', sortable: true, label: 'Order', render: (r) => r.displayOrder },
  { key: 'status', sortable: true, label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'label', label: 'Platform (e.g. LinkedIn, Instagram)', type: 'text', required: true },
  { name: 'url', label: 'Profile URL', type: 'text', required: true },
  { name: 'openNewTab', label: 'Open in a new tab', type: 'checkbox' },
  { name: 'displayOrder', label: 'Display order', type: 'number', help: 'Lower numbers appear first — edit to reorder.' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'ARCHIVED', label: 'Archived' },
    ],
  },
];

export function SocialLinksPage() {
  return (
    <ContentCrudPage<SiteLink>
      title="Social links"
      description="Only PUBLISHED links appear in the site footer, ordered by display order."
      basePath="/admin/content/social-links"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search social links…"
    />
  );
}
