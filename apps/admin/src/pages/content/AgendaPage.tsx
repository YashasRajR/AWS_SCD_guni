import type { AgendaItem } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { useCurrentEventId, usePaginatedResource } from '../../lib/hooks.js';
import { formatDateTime } from '../../lib/format.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

interface NamedOption {
  id: string;
  name?: string;
  title?: string;
}

const columns: Column<AgendaItem>[] = [
  { key: 'title', label: 'Title', render: (r) => r.title },
  { key: 'startTime', label: 'Starts', render: (r) => formatDateTime(r.startTime) },
  { key: 'endTime', label: 'Ends', render: (r) => formatDateTime(r.endTime) },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

export function AgendaPage() {
  const eventId = useCurrentEventId();
  const { items: sessions } = usePaginatedResource<NamedOption>('/admin/content/sessions', 1, 100);
  const { items: venues } = usePaginatedResource<NamedOption>('/admin/content/venues', 1, 100);

  const fields: FieldDef[] = [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'startTime', label: 'Start time', type: 'datetime', required: true },
    { name: 'endTime', label: 'End time', type: 'datetime', required: true },
    {
      name: 'sessionId',
      label: 'Linked session',
      type: 'select',
      options: sessions.map((s) => ({ value: s.id, label: s.title ?? s.id })),
    },
    {
      name: 'venueId',
      label: 'Venue',
      type: 'select',
      options: venues.map((v) => ({ value: v.id, label: v.name ?? v.id })),
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

  return (
    <ContentCrudPage<AgendaItem>
      title="Agenda"
      description="Only PUBLISHED agenda items appear on the public site."
      basePath="/admin/content/agenda"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      createExtraValues={eventId ? { eventId } : undefined}
    />
  );
}
