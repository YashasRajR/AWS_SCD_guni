import type { Speaker } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<Speaker>[] = [
  { key: 'name', sortable: true, label: 'Name', render: (r) => r.name },
  { key: 'organization', label: 'Organization', render: (r) => r.organization ?? '—' },
  { key: 'displayOrder', sortable: true, label: 'Order', render: (r) => r.displayOrder },
  { key: 'status', sortable: true, label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'designation', label: 'Designation', type: 'text' },
  { name: 'organization', label: 'Organization', type: 'text' },
  { name: 'bio', label: 'Bio', type: 'textarea' },
  { name: 'profileImage', label: 'Profile image URL', type: 'text' },
  { name: 'linkedinUrl', label: 'LinkedIn URL', type: 'text' },
  { name: 'websiteUrl', label: 'Website URL', type: 'text' },
  { name: 'displayOrder', label: 'Display order', type: 'number' },
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

export function SpeakersPage() {
  return (
    <ContentCrudPage<Speaker>
      title="Speakers"
      description="Only PUBLISHED speakers appear on the public site."
      basePath="/admin/content/speakers"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search speakers by name or organization…"
    />
  );
}
