import type { Venue } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { useCurrentEventId } from '../../lib/hooks.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<Venue>[] = [
  { key: 'name', label: 'Name', render: (r) => r.name },
  { key: 'location', label: 'Location', render: (r) => r.location ?? '—' },
  { key: 'capacity', label: 'Capacity', render: (r) => r.capacity ?? '—' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'room', label: 'Room', type: 'text' },
  { name: 'capacity', label: 'Capacity', type: 'number' },
  { name: 'mapUrl', label: 'Map URL', type: 'text' },
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

export function VenuesPage() {
  const eventId = useCurrentEventId();

  return (
    <ContentCrudPage<Venue>
      title="Venues"
      description="Only PUBLISHED venues appear on the public site."
      basePath="/admin/content/venues"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      createExtraValues={eventId ? { eventId } : undefined}
    />
  );
}
