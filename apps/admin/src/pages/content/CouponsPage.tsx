import type { Coupon } from '@scd/types';
import { ContentCrudPage } from '../../components/ContentCrudPage.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import type { Column } from '../../components/Table.js';
import type { FieldDef } from '../../components/ResourceForm.js';

const columns: Column<Coupon>[] = [
  { key: 'code', sortable: true, label: 'Code', render: (r) => r.code },
  { key: 'name', label: 'Name', render: (r) => r.name ?? '—' },
  {
    key: 'discountValue',
    label: 'Discount',
    render: (r) => (r.discountType === 'PERCENT' ? `${r.discountValue}%` : `${r.currency} ${r.discountValue}`),
  },
  { key: 'maxUses', label: 'Max uses', render: (r) => r.maxUses ?? 'Unlimited' },
  { key: 'perUserLimit', label: 'Per-user limit', render: (r) => r.perUserLimit },
  {
    key: 'isActive',
    label: 'Status',
    render: (r) => <StatusBadge status={r.isActive ? 'PUBLISHED' : 'ARCHIVED'} />,
  },
];

const fields: FieldDef[] = [
  {
    name: 'code',
    label: 'Code',
    type: 'text',
    required: true,
    help: 'Uppercase letters, digits, hyphens, underscores only (e.g. AWSGUNI25).',
  },
  { name: 'name', label: 'Name', type: 'text' },
  {
    name: 'discountType',
    label: 'Discount type',
    type: 'select',
    required: true,
    options: [
      { value: 'PERCENT', label: 'Percentage' },
      { value: 'FIXED', label: 'Fixed amount' },
    ],
  },
  { name: 'discountValue', label: 'Discount value', type: 'number', required: true },
  { name: 'currency', label: 'Currency', type: 'text', help: '3-letter code, e.g. INR. Only used for a fixed discount.' },
  { name: 'startsAt', label: 'Starts at', type: 'datetime', help: 'Leave blank to activate immediately.' },
  { name: 'endsAt', label: 'Ends at', type: 'datetime', help: 'Leave blank to never expire.' },
  { name: 'maxUses', label: 'Max total uses', type: 'number', help: 'Leave blank for unlimited.' },
  { name: 'perUserLimit', label: 'Per-attendee limit', type: 'number' },
  { name: 'minOrderAmount', label: 'Minimum order amount', type: 'number', help: 'Leave blank for no minimum.' },
  { name: 'maxDiscountAmount', label: 'Maximum discount amount', type: 'number', help: 'Caps a percentage discount.' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export function CouponsPage() {
  return (
    <ContentCrudPage<Coupon>
      title="Coupons"
      description="Coupons are validated server-side and never listed publicly -- attendees enter a code directly on the registration form."
      basePath="/admin/content/coupons"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      searchPlaceholder="Search coupons by code or name…"
    />
  );
}
