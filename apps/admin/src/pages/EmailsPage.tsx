import { useState } from 'react';
import type { EmailRecord } from '@scd/types';
import { usePaginatedResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { StatusBadge } from '../components/StatusBadge.js';

const columns: Column<EmailRecord>[] = [
  { key: 'recipient', label: 'Recipient', render: (r) => r.recipient },
  { key: 'template', label: 'Template', render: (r) => r.template },
  { key: 'subject', label: 'Subject', render: (r) => r.subject },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'sentAt', label: 'Sent at', render: (r) => formatDateTime(r.sentAt) },
  { key: 'failureReason', label: 'Failure', render: (r) => r.failureReason ?? '—' },
  { key: 'createdAt', label: 'Created', render: (r) => formatDateTime(r.createdAt) },
];

export function EmailsPage() {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<EmailRecord>(
    '/admin/emails',
    page,
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Emails</h1>
          <p className="page-description">Outgoing email records — verification, confirmations, tickets, and more.</p>
        </div>
      </div>

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
