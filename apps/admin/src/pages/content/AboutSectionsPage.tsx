import type { AboutSection } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<AboutSection>[] = [
  { key: 'title', sortable: true, label: 'Title', render: (r) => r.title },
  { key: 'displayOrder', sortable: true, label: 'Order', render: (r) => r.displayOrder },
  { key: 'status', sortable: true, label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'body', label: 'Body', type: 'textarea', required: true },
  { name: 'imageUrl', label: 'Image', type: 'image' },
  { name: 'linkUrl', label: 'Link URL', type: 'text' },
  { name: 'linkLabel', label: 'Link label', type: 'text' },
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

export function AboutSectionsPage() {
  return (
    <ContentCrudPage<AboutSection>
      title="About / AWS section"
      description="Only PUBLISHED sections appear on the public site's About section, ordered by display order."
      basePath="/admin/content/about-sections"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search by title…"
    />
  );
}
