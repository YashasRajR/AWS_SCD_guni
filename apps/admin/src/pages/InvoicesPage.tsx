import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Invoice } from '@scd/types';
import { describeApiError } from '@scd/api-client';
import { usePaginatedResource, useDebouncedSearch, useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { getStoredToken } from '../lib/auth-storage.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { Modal } from '../components/Modal.js';

/** The PDF endpoint returns a raw application/pdf body (not the JSON
 * envelope), so it needs its own authenticated fetch rather than apiClient. */
async function downloadInvoicePdf(invoiceId: string, invoiceNumber: string): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/admin/invoices/${invoiceId}/pdf`, {
    headers: { Authorization: `Bearer ${getStoredToken() ?? ''}` },
  });
  if (!res.ok) throw new Error('Failed to download PDF.');
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${invoiceNumber}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

interface DocumentVersion {
  id: string;
  version: number;
  reason: string | null;
  createdAt: string;
}

async function downloadVersionPdf(path: string, filename: string): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    headers: { Authorization: `Bearer ${getStoredToken() ?? ''}` },
  });
  if (!res.ok) throw new Error('Failed to download PDF.');
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function InvoiceHistoryModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { data: versions, loading, error } = useResource<DocumentVersion[]>(
    `/admin/invoices/${invoice.id}/versions`,
  );

  return (
    <Modal title={`Version history — ${invoice.invoiceNumber}`} onClose={onClose}>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : !versions || versions.length === 0 ? (
        <p className="form-help">No prior versions — this invoice has never been regenerated.</p>
      ) : (
        <div className="qr-token-list">
          {versions.map((v) => (
            <div className="qr-token-row" key={v.id}>
              <div>
                <strong>Version {v.version}</strong>{' '}
                <span className="form-help">{formatDateTime(v.createdAt)}</span>
                {v.reason && <div className="form-help">{v.reason}</div>}
              </div>
              <button
                type="button"
                className="btn-link"
                onClick={() =>
                  downloadVersionPdf(
                    `/admin/invoices/${invoice.id}/versions/${v.version}/pdf`,
                    `invoice-${invoice.invoiceNumber}-v${v.version}.pdf`,
                  )
                }
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

const columns: Column<Invoice>[] = [
  { key: 'invoiceNumber', label: 'Invoice #', render: (r) => r.invoiceNumber },
  { key: 'registrationId', label: 'Registration ID', render: (r) => r.registrationId.slice(0, 8) + '…' },
  { key: 'amount', label: 'Amount', render: (r) => `${r.currency} ${r.amount}` },
  { key: 'discountAmount', label: 'Discount', render: (r) => `${r.currency} ${r.discountAmount}` },
  { key: 'generatedAt', label: 'Generated', render: (r) => formatDateTime(r.generatedAt) },
];

export function InvoicesPage() {
  const [urlParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<Invoice | null>(null);
  const { searchInput, setSearchInput, search } = useDebouncedSearch(setPage, urlParams.get('search') ?? '');
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<Invoice>(
    '/admin/invoices',
    page,
    20,
    { search: search || undefined },
  );

  const handleDownloadPdf = async (invoice: Invoice) => {
    setBusyId(invoice.id);
    setActionError(null);
    try {
      await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleResendEmail = async (invoice: Invoice) => {
    setBusyId(invoice.id);
    setActionError(null);
    try {
      await apiClient.post(`/admin/invoices/${invoice.id}/resend-email`);
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRegenerate = async (invoice: Invoice) => {
    const reason = window.prompt('Reason for regenerating this invoice PDF (kept in its version history):');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setActionError('A reason of at least 3 characters is required.');
      return;
    }
    setBusyId(invoice.id);
    setActionError(null);
    try {
      await apiClient.post(`/admin/invoices/${invoice.id}/regenerate`, { reason: reason.trim() });
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const tableColumns: Column<Invoice>[] = [
    ...columns,
    {
      key: '__actions',
      label: '',
      width: '340px',
      render: (row) => (
        <div className="row-actions">
          <button
            type="button"
            className="btn-link"
            disabled={busyId === row.id || !row.pdfAvailable}
            onClick={() => handleDownloadPdf(row)}
          >
            Download PDF
          </button>
          <button
            type="button"
            className="btn-link"
            disabled={busyId === row.id || !row.pdfAvailable}
            onClick={() => handleResendEmail(row)}
          >
            Resend email
          </button>
          <button
            type="button"
            className="btn-link"
            disabled={busyId === row.id || !row.pdfAvailable}
            onClick={() => handleRegenerate(row)}
          >
            Regenerate
          </button>
          <button type="button" className="btn-link" onClick={() => setHistoryInvoice(row)}>
            History
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="page-description">Fee receipts are automatically generated when a payment is confirmed.</p>
        </div>
      </div>

      {actionError && <p className="form-error">{actionError}</p>}

      <div className="page-toolbar">
        <input
          type="search"
          className="input search-input"
          placeholder="Search by invoice #…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <Table columns={tableColumns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />

      {historyInvoice && <InvoiceHistoryModal invoice={historyInvoice} onClose={() => setHistoryInvoice(null)} />}
    </div>
  );
}
