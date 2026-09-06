import type { PastEvent } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { formatDate } from '../../lib/format.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<PastEvent>[] = [
  { key: 'eventName', label: 'Event', render: (r) => r.eventName },
  { key: 'year', sortable: true, label: 'Year', render: (r) => r.year },
  { key: 'sessionName', label: 'Session', render: (r) => r.sessionName ?? '—' },
  { key: 'eventDate', label: 'Date', render: (r) => (r.eventDate ? formatDate(r.eventDate) : '—') },
  { key: 'status', sortable: true, label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'eventName', label: 'Event name', type: 'text', required: true },
  { name: 'year', label: 'Year', type: 'number', required: true },
  { name: 'sessionName', label: 'Session name', type: 'text' },
  { name: 'sessionImage', label: 'Session image', type: 'image' },
  { name: 'shortDescription', label: 'Short description', type: 'textarea' },
  { name: 'eventDate', label: 'Event date', type: 'date' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'archiveUrl', label: 'Archive link', type: 'text', help: 'Optional link to a full recap/archive page.' },
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

export function PastEventsPage() {
  return (
    <ContentCrudPage<PastEvent>
      title="Past events"
      description="Only PUBLISHED entries appear on the public site, newest year first."
      basePath="/admin/content/past-events"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search past events by name, session, or location…"
    />
  );
}
