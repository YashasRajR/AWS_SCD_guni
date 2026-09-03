import { useState } from 'react';
import type { Ticket } from '@scd/types';
import { usePaginatedResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { StatusBadge } from '../components/StatusBadge.js';

const columns: Column<Ticket>[] = [
  { key: 'ticketNumber', label: 'Ticket #', render: (r) => r.ticketNumber },
  { key: 'registrationId', label: 'Registration ID', render: (r) => r.registrationId.slice(0, 8) + '…' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'issuedAt', label: 'Issued', render: (r) => formatDateTime(r.issuedAt) },
];

export function TicketsPage() {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<Ticket>(
    '/admin/registrations',
    page,
  );

  // Note: Tickets don't have their own list endpoint yet — they are derived
  // from registrations. For now, we show registrations which implicitly
  // indicates ticket status. A dedicated /admin/tickets endpoint can be added
  // when needed.

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p className="page-description">Tickets are automatically issued when registration is confirmed.</p>
        </div>
      </div>

      <p className="status-line">
        Tickets are managed through the registration flow. Check the{' '}
        <a href="/registrations">Registrations</a> page for registration status.
      </p>
    </div>
  );
}
