import type { TimelineItem } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { useCurrentEventId } from '../../lib/hooks.js';
import { formatDateTime } from '../../lib/format.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<TimelineItem>[] = [
  { key: 'title', sortable: true, label: 'Title', render: (r) => r.title },
  { key: 'type', label: 'Type', render: (r) => r.type },
  { key: 'startTime', sortable: true, label: 'Starts', render: (r) => formatDateTime(r.startTime) },
  { key: 'status', sortable: true, label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'startTime', label: 'Start time', type: 'datetime', required: true },
  { name: 'endTime', label: 'End time', type: 'datetime' },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: [
      { value: 'REGISTRATION', label: 'Registration' },
      { value: 'MEAL', label: 'Meal' },
      { value: 'SESSION', label: 'Session' },
      { value: 'BREAK', label: 'Break' },
      { value: 'NETWORKING', label: 'Networking' },
      { value: 'CLOSING', label: 'Closing' },
      { value: 'OTHER', label: 'Other' },
    ],
  },
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

export function TimelinePage() {
  const eventId = useCurrentEventId();

  return (
    <ContentCrudPage<TimelineItem>
      title="Timeline"
      description="Only PUBLISHED timeline items appear on the public site."
      basePath="/admin/content/timeline"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search timeline items by title or description…"
      createExtraValues={eventId ? { eventId } : undefined}
    />
  );
}
