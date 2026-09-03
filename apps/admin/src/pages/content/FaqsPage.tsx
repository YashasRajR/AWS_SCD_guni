import type { Faq } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<Faq>[] = [
  { key: 'question', label: 'Question', render: (r) => r.question },
  { key: 'category', sortable: true, label: 'Category', render: (r) => r.category ?? '—' },
  { key: 'status', sortable: true, label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'question', label: 'Question', type: 'text', required: true },
  { name: 'answer', label: 'Answer', type: 'textarea', required: true },
  { name: 'category', label: 'Category', type: 'text' },
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

export function FaqsPage() {
  return (
    <ContentCrudPage<Faq>
      title="FAQs"
      description="Only PUBLISHED FAQs appear on the public site."
      basePath="/admin/content/faqs"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search FAQs by question, answer, or category…"
    />
  );
}
