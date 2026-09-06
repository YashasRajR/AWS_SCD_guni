import type { TicketPlan } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<TicketPlan>[] = [
  { key: 'name', sortable: true, label: 'Name', render: (r) => r.name },
  { key: 'code', label: 'Code', render: (r) => r.code },
  { key: 'price', sortable: true, label: 'Price', render: (r) => `${r.currency} ${r.price}` },
  { key: 'displayOrder', sortable: true, label: 'Order', render: (r) => r.displayOrder },
  {
    key: 'isActive',
    label: 'Status',
    render: (r) => <StatusBadge status={r.isActive ? 'PUBLISHED' : 'ARCHIVED'} />,
  },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  {
    name: 'code',
    label: 'Code',
    type: 'text',
    required: true,
    help: 'Uppercase letters, digits, underscores only (e.g. STUDENT). Used by the registration form.',
  },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'price', label: 'Price', type: 'number', required: true },
  { name: 'currency', label: 'Currency', type: 'text', help: '3-letter code, e.g. INR.' },
  { name: 'displayOrder', label: 'Display order', type: 'number' },
  { name: 'isActive', label: 'Active (selectable on the registration form)', type: 'checkbox' },
];

export function TicketPlansPage() {
  return (
    <ContentCrudPage<TicketPlan>
      title="Ticket plans"
      description="Only active plans appear on the attendee registration form. Prices here are the single source of truth for checkout, invoices, and reports."
      basePath="/admin/content/ticket-plans"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search ticket plans by name or code…"
    />
  );
}
