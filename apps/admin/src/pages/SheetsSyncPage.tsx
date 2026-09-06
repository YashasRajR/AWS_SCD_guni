import { useState } from 'react';
import { usePaginatedResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { StatusBadge } from '../components/StatusBadge.js';

interface SheetsSyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  status: 'PENDING' | 'RETRYING' | 'SYNCED' | 'FAILED';
  attempts: number;
  lastError: string | null;
  syncedAt: string | null;
  createdAt: string;
}

const columns: Column<SheetsSyncQueueItem>[] = [
  { key: 'entityType', label: 'Entity', render: (r) => r.entityType },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'attempts', label: 'Attempts', render: (r) => r.attempts },
  { key: 'lastError', label: 'Last error', render: (r) => r.lastError ?? '—' },
  { key: 'syncedAt', label: 'Synced at', render: (r) => formatDateTime(r.syncedAt) },
  { key: 'createdAt', label: 'Queued', render: (r) => formatDateTime(r.createdAt) },
];

export function SheetsSyncPage() {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<SheetsSyncQueueItem>(
    '/admin/sheets-sync',
    page,
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Sheets sync</h1>
          <p className="page-description">
            Confirmed registrations queue here for export to the configured Google Sheet. Rows stay PENDING/RETRYING
            until GOOGLE_SHEETS_* is configured on the backend — see System status for whether it's set up.
          </p>
        </div>
      </div>

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
