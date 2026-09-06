import type { SiteLink } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<SiteLink>[] = [
  { key: 'label', label: 'Label', render: (r) => r.label },
  { key: 'url', label: 'Destination', render: (r) => r.url },
  { key: 'displayOrder', sortable: true, label: 'Order', render: (r) => r.displayOrder },
  { key: 'status', sortable: true, label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'label', label: 'Label', type: 'text', required: true },
  { name: 'url', label: 'Destination', type: 'text', required: true, help: 'An internal path (e.g. /speakers) or a full external URL.' },
  { name: 'isExternal', label: 'External link', type: 'checkbox' },
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

export function NavLinksPage() {
  return (
    <ContentCrudPage<SiteLink>
      title="Navigation links"
      description="Only PUBLISHED links appear in the site header, ordered by display order."
      basePath="/admin/content/nav-links"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search nav links…"
    />
  );
}
