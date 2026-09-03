import type { Announcement } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { formatDateTime } from '../../lib/format.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<Announcement>[] = [
  { key: 'title', sortable: true, label: 'Title', render: (r) => r.title },
  { key: 'priority', sortable: true, label: 'Priority', render: (r) => r.priority },
  { key: 'publishAt', label: 'Publishes', render: (r) => formatDateTime(r.publishAt) },
  { key: 'expiresAt', label: 'Expires', render: (r) => formatDateTime(r.expiresAt) },
  { key: 'status', sortable: true, label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'message', label: 'Message', type: 'textarea', required: true },
  {
    name: 'priority',
    label: 'Priority',
    type: 'select',
    required: true,
    options: [
      { value: 'LOW', label: 'Low' },
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'High' },
      { value: 'URGENT', label: 'Urgent' },
    ],
  },
  { name: 'publishAt', label: 'Publish at', type: 'datetime', help: 'Leave blank to publish immediately.' },
  { name: 'expiresAt', label: 'Expires at', type: 'datetime', help: 'Leave blank to never expire.' },
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

export function AnnouncementsPage() {
  return (
    <ContentCrudPage<Announcement>
      title="Announcements"
      description="Only PUBLISHED, currently-active announcements appear on the public site."
      basePath="/admin/content/announcements"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search announcements by title or message…"
    />
  );
}
