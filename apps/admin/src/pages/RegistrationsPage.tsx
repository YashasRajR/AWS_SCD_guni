import { useState } from 'react';
import type { Registration } from '@scd/types';
import { usePaginatedResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { ApiClientError } from '@scd/api-client';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { getStoredToken } from '../lib/auth-storage.js';

const STATUSES = ['PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'REJECTED'];

async function downloadRegistrationsCsv(): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/admin/registrations/export`, {
    headers: { Authorization: `Bearer ${getStoredToken() ?? ''}` },
  });
  if (!res.ok) throw new Error('Failed to download export.');
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = 'registrations.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function RegistrationsPage() {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error, reload } = usePaginatedResource<Registration>(
    '/admin/registrations',
    page,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setRowError(null);
    try {
      await downloadRegistrationsCsv();
    } catch {
      setRowError('Failed to download export.');
    } finally {
      setExporting(false);
    }
  };

  const updateStatus = async (registration: Registration, status: string) => {
    if (status === registration.status) return;
    setUpdatingId(registration.id);
    setRowError(null);
    try {
      await apiClient.patch(`/admin/registrations/${registration.id}/status`, { status });
      reload();
    } catch (err) {
      setRowError(err instanceof ApiClientError ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<Registration>[] = [
    { key: 'registrationNumber', label: 'Registration #', render: (r) => r.registrationNumber },
    { key: 'ticketPlan', label: 'Ticket plan', render: (r) => r.ticketPlan?.name ?? '—' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <div className="row-actions">
          <StatusBadge status={r.status} />
          <select
            value={r.status}
            disabled={updatingId === r.id}
            onChange={(e) => updateStatus(r, e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    { key: 'registeredAt', label: 'Registered', render: (r) => formatDateTime(r.registeredAt) },
    { key: 'confirmedAt', label: 'Confirmed', render: (r) => formatDateTime(r.confirmedAt) },
    { key: 'cancelledAt', label: 'Cancelled', render: (r) => formatDateTime(r.cancelledAt) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Registrations</h1>
          <p className="page-description">Change a registration's status directly from the dropdown.</p>
        </div>
        <button type="button" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {rowError && <p className="form-error">{rowError}</p>}

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
