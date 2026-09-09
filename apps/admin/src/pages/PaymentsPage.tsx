import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PAYMENT_STATUSES, type Payment, type PaymentStatus } from '@scd/types';
import { usePaginatedResource, useDebouncedSearch } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { downloadFile } from '../lib/download.js';

export function PaymentsPage() {
  const [urlParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const { searchInput, setSearchInput, search } = useDebouncedSearch(setPage, urlParams.get('search') ?? '');
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<Payment>(
    '/admin/payments',
    page,
    20,
    { search: search || undefined, status: status || undefined },
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await downloadFile('/admin/payments/export', 'payments.csv');
    } catch {
      setExportError('Failed to download export.');
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<Payment>[] = [
    {
      key: 'registrationId',
      label: 'Registration ID',
      render: (r) => <Link to={`/payments/${r.id}`}>{r.registrationId.slice(0, 8)}…</Link>,
    },
    { key: 'amount', label: 'Amount', render: (r) => `${r.currency} ${r.amount}` },
    { key: 'provider', label: 'Provider', render: (r) => r.provider ?? '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'paidAt', label: 'Paid at', render: (r) => formatDateTime(r.paidAt) },
    { key: 'createdAt', label: 'Created', render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p className="page-description">
            Payment status is normally set by the payment provider — open one to verify, refund, or record a
            manual reconciliation.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {exportError && <p className="form-error">{exportError}</p>}

      <div className="page-toolbar">
        <input
          type="search"
          className="input search-input"
          placeholder="Search by gateway ID or registration #…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PaymentStatus | '');
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
