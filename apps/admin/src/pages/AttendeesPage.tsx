import { useState } from 'react';
import type { Attendee } from '@scd/types';
import { usePaginatedResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';

const columns: Column<Attendee>[] = [
  { key: 'fullName', label: 'Name', render: (r) => r.fullName },
  { key: 'university', label: 'University', render: (r) => r.university ?? '—' },
  { key: 'department', label: 'Department', render: (r) => r.department ?? '—' },
  { key: 'year', label: 'Year', render: (r) => r.year ?? '—' },
  { key: 'registrationType', label: 'Type', render: (r) => r.registrationType ?? '—' },
  { key: 'createdAt', label: 'Registered', render: (r) => formatDateTime(r.createdAt) },
];

export function AttendeesPage() {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<Attendee>('/admin/attendees', page);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attendees</h1>
          <p className="page-description">Read-only — attendee profiles are created through registration.</p>
        </div>
      </div>

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
