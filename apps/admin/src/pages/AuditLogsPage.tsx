import { useState } from 'react';
import type { AuditLog } from '@scd/types';
import { usePaginatedResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';

const columns: Column<AuditLog>[] = [
  { key: 'createdAt', label: 'When', render: (r) => formatDateTime(r.createdAt) },
  { key: 'action', label: 'Action', render: (r) => r.action },
  { key: 'entityType', label: 'Entity', render: (r) => r.entityType },
  { key: 'role', label: 'Role', render: (r) => r.role ?? '—' },
  {
    key: 'metadata',
    label: 'Details',
    render: (r) => (r.metadata ? <code className="metadata">{JSON.stringify(r.metadata)}</code> : '—'),
  },
];

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<AuditLog>(
    '/admin/audit-logs',
    page,
    50,
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit logs</h1>
          <p className="page-description">Every admin write action, newest first.</p>
        </div>
      </div>

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
