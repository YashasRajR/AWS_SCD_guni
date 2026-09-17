import type { Achievement } from '@scd/types';
import { ContentCrudPage } from '../components/ContentCrudPage.js';
import { StatusBadge } from '../components/StatusBadge.js';
import type { Column } from '../components/Table.js';
import type { FieldDef } from '../components/ResourceForm.js';

const columns: Column<Achievement>[] = [
  { key: 'name', label: 'Name', render: (r) => r.name },
  { key: 'slug', label: 'Slug', render: (r) => r.slug },
  { key: 'conditionType', label: 'Rule', render: (r) => r.conditionType },
  { key: 'displayOrder', label: 'Order', render: (r) => r.displayOrder },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'text', required: true, help: 'Lowercase letters, numbers, and hyphens only.' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'iconUrl', label: 'Icon URL', type: 'text' },
  {
    name: 'conditionType',
    label: 'Evaluation rule',
    type: 'select',
    required: true,
    options: [
      { value: 'MANUAL', label: 'Manual (admin only)' },
      { value: 'SESSION_COUNT', label: 'Session count' },
    ],
  },
  { name: 'displayOrder', label: 'Display order', type: 'number' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Published' },
      { value: 'ARCHIVED', label: 'Archived' },
    ],
  },
];

export function AchievementsPage() {
  return (
    <ContentCrudPage<Achievement>
      title="Achievements"
      description="Data-driven achievements unlocked by attendee participation."
      basePath="/admin/achievements"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
    />
  );
}
