import type { Session } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { usePaginatedResource } from '../../lib/hooks.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

interface SpeakerOption {
  id: string;
  name: string;
}

const columns: Column<Session>[] = [
  { key: 'title', sortable: true, label: 'Title', render: (r) => r.title },
  { key: 'sessionType', label: 'Type', render: (r) => r.sessionType },
  { key: 'track', label: 'Track', render: (r) => r.track ?? '—' },
  {
    key: 'speakers',
    label: 'Speakers',
    render: (r) => (r.speakers && r.speakers.length > 0 ? r.speakers.map((s) => s.name).join(', ') : '—'),
  },
  { key: 'status', sortable: true, label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

export function SessionsPage() {
  // Every speaker (any status) is a valid link target — a draft session
  // can reference a not-yet-published speaker.
  const { items: speakerOptions } = usePaginatedResource<SpeakerOption>('/admin/content/speakers', 1, 100);

  const fields: FieldDef[] = [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'sessionType',
      label: 'Session type',
      type: 'select',
      required: true,
      options: [
        { value: 'KEYNOTE', label: 'Keynote' },
        { value: 'TALK', label: 'Talk' },
        { value: 'WORKSHOP', label: 'Workshop' },
        { value: 'PANEL', label: 'Panel' },
        { value: 'BREAK', label: 'Break' },
      ],
    },
    { name: 'track', label: 'Track', type: 'text' },
    { name: 'durationMinutes', label: 'Duration (minutes)', type: 'number' },
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
    {
      name: 'speakerIds',
      label: 'Speakers',
      type: 'multiselect',
      options: speakerOptions.map((s) => ({ value: s.id, label: s.name })),
    },
  ];

  return (
    <ContentCrudPage<Session>
      title="Sessions"
      description="Only PUBLISHED sessions appear on the public site."
      basePath="/admin/content/sessions"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row, speakerIds: row.speakers?.map((s) => s.id) ?? [] })}
      searchPlaceholder="Search sessions by title, description, or track…"
    />
  );
}
