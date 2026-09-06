import type { GalleryItem } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<GalleryItem>[] = [
  {
    key: 'imageUrl',
    label: 'Image',
    render: (r) => <img src={r.imageUrl} alt={r.altText ?? ''} className="image-field-preview" />,
  },
  { key: 'caption', label: 'Caption', render: (r) => r.caption ?? '—' },
  { key: 'category', sortable: true, label: 'Category', render: (r) => r.category ?? '—' },
  { key: 'eventYear', sortable: true, label: 'Year', render: (r) => r.eventYear ?? '—' },
  { key: 'displayOrder', sortable: true, label: 'Order', render: (r) => r.displayOrder },
  { key: 'status', sortable: true, label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'imageUrl', label: 'Image', type: 'image', required: true },
  { name: 'caption', label: 'Caption', type: 'text' },
  { name: 'altText', label: 'Alt text', type: 'text', help: 'Describes the image for screen readers.' },
  { name: 'category', label: 'Category', type: 'text' },
  { name: 'eventYear', label: 'Event year', type: 'number' },
  { name: 'sessionId', label: 'Session ID', type: 'text', help: 'Optional — link this photo to a session by its ID.' },
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

export function GalleryPage() {
  return (
    <ContentCrudPage<GalleryItem>
      title="Gallery"
      description="Only PUBLISHED photos appear on the public site, grouped by category and ordered by display order."
      basePath="/admin/content/gallery"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search gallery by caption or category…"
    />
  );
}
