import { useState } from 'react';
import type { Invoice } from '@scd/types';
import { describeApiError } from '@scd/api-client';
import { usePaginatedResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { getStoredToken } from '../lib/auth-storage.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';

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

const columns: Column<Invoice>[] = [
  { key: 'invoiceNumber', label: 'Invoice #', render: (r) => r.invoiceNumber },
  { key: 'registrationId', label: 'Registration ID', render: (r) => r.registrationId.slice(0, 8) + '…' },
  { key: 'amount', label: 'Amount', render: (r) => `${r.currency} ${r.amount}` },
  { key: 'discountAmount', label: 'Discount', render: (r) => `${r.currency} ${r.discountAmount}` },
  { key: 'generatedAt', label: 'Generated', render: (r) => formatDateTime(r.generatedAt) },
];

export function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<Invoice>(
    '/admin/invoices',
    page,
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

  const tableColumns: Column<Invoice>[] = [
    ...columns,
    {
      key: '__actions',
      label: '',
      width: '220px',
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

      <Table columns={tableColumns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
