import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Registration } from '@scd/types';
import { usePaginatedResource, useDebouncedSearch } from '../lib/hooks.js';
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
  const [urlParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const { searchInput, setSearchInput, search } = useDebouncedSearch(setPage, urlParams.get('search') ?? '');
  const { items, totalItems, totalPages, loading, error, reload } = usePaginatedResource<Registration>(
    '/admin/registrations',
    page,
    20,
    { search: search || undefined },
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState(STATUSES[0]!);
  const [bulkApplying, setBulkApplying] = useState(false);

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

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(items.map((r) => r.id)) : new Set());
  };

  /** Fires the same per-row status PATCH used above, once per selected id —
   * this is a single-event platform with row counts in the thousands at
   * most (see registrations.repository.ts), so a dedicated bulk endpoint
   * isn't worth the extra surface yet. */
  const applyBulkStatus = async () => {
    setBulkApplying(true);
    setRowError(null);
    const ids = [...selected];
    const results = await Promise.allSettled(
      ids.map((id) => apiClient.patch(`/admin/registrations/${id}/status`, { status: bulkStatus })),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) setRowError(`${failed} of ${ids.length} updates failed.`);
    setSelected(new Set());
    setBulkApplying(false);
    reload();
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
          {r.status === 'WAITLISTED' && (
            <>
              <button
                type="button"
                className="btn-link"
                disabled={updatingId === r.id}
                onClick={() => updateStatus(r, 'CONFIRMED')}
              >
                Promote
              </button>
              <button
                type="button"
                className="btn-link btn-link-danger"
                disabled={updatingId === r.id}
                onClick={() => updateStatus(r, 'REJECTED')}
              >
                Reject
              </button>
            </>
          )}
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
          <p className="page-description">Waitlisted registrations get quick Promote/Reject actions; any other transition is a plain status change from the dropdown.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {rowError && <p className="form-error">{rowError}</p>}

      {selected.size > 0 && (
        <div className="bulk-action-bar">
          <span>{selected.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="button" onClick={applyBulkStatus} disabled={bulkApplying}>
            {bulkApplying ? 'Applying…' : 'Set status'}
          </button>
          <button type="button" className="btn-link" onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      <div className="page-toolbar">
        <input
          type="search"
          className="input search-input"
          placeholder="Search by registration #…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        rows={items}
        getRowId={(r) => r.id}
        loading={loading}
        error={error}
        selectedIds={selected}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
      />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
