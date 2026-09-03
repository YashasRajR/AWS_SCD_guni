import { useState } from 'react';
import type { Payment } from '@scd/types';
import { usePaginatedResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { StatusBadge } from '../components/StatusBadge.js';

const columns: Column<Payment>[] = [
  { key: 'registrationId', label: 'Registration ID', render: (r) => r.registrationId.slice(0, 8) + '…' },
  { key: 'amount', label: 'Amount', render: (r) => `${r.currency} ${r.amount}` },
  { key: 'provider', label: 'Provider', render: (r) => r.provider ?? '—' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'paidAt', label: 'Paid at', render: (r) => formatDateTime(r.paidAt) },
  { key: 'createdAt', label: 'Created', render: (r) => formatDateTime(r.createdAt) },
];

export function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<Payment>(
    '/admin/payments',
    page,
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p className="page-description">Payment status is set by the payment provider — admin cannot manually mark a payment as paid.</p>
        </div>
      </div>

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
