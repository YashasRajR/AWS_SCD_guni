import { useState } from 'react';
import type { QrToken, QrTokenType, Ticket } from '@scd/types';
import { describeApiError } from '@scd/api-client';
import { usePaginatedResource, useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { getStoredToken } from '../lib/auth-storage.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Modal } from '../components/Modal.js';

const columns: Column<Ticket>[] = [
  { key: 'ticketNumber', label: 'Ticket #', render: (r) => r.ticketNumber },
  { key: 'registrationId', label: 'Registration ID', render: (r) => r.registrationId.slice(0, 8) + '…' },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'issuedAt', label: 'Issued', render: (r) => formatDateTime(r.issuedAt) },
];

const QR_TYPES: QrTokenType[] = ['REGISTRATION', 'GOODIE'];

interface DocumentVersion {
  id: string;
  version: number;
  reason: string | null;
  createdAt: string;
}

async function downloadVersionPdf(
  path: string,
  filename: string,
): Promise<void> {
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

function TicketHistoryModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const { data: versions, loading, error } = useResource<DocumentVersion[]>(
    `/admin/tickets/${ticket.id}/versions`,
  );

  return (
    <Modal title={`Version history — ${ticket.ticketNumber}`} onClose={onClose}>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : !versions || versions.length === 0 ? (
        <p className="form-help">No prior versions — this ticket has never been reissued.</p>
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
                    `/admin/tickets/${ticket.id}/versions/${v.version}/pdf`,
                    `ticket-${ticket.ticketNumber}-v${v.version}.pdf`,
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

/** The PDF endpoint returns a raw application/pdf body (not the JSON
 * envelope), so it needs its own authenticated fetch rather than apiClient. */
async function downloadTicketPdf(ticketId: string, ticketNumber: string): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/admin/tickets/${ticketId}/pdf`, {
    headers: { Authorization: `Bearer ${getStoredToken() ?? ''}` },
  });
  if (!res.ok) throw new Error('Failed to download PDF.');
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `ticket-${ticketNumber}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function QrTokensModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const { data: tokens, loading, error, reload } = useResource<QrToken[]>(`/admin/tickets/${ticket.id}/qr-tokens`);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const tokenByType = new Map((tokens ?? []).map((t) => [t.type, t]));

  const rotate = async (type: QrTokenType) => {
    setBusy(type);
    setActionError(null);
    try {
      await apiClient.post(`/admin/tickets/${ticket.id}/qr-tokens/${type}/rotate`);
      reload();
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (token: QrToken) => {
    setBusy(token.type);
    setActionError(null);
    try {
      await apiClient.delete(`/admin/qr-tokens/${token.id}`);
      reload();
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal title={`QR tokens for ${ticket.ticketNumber}`} onClose={onClose}>
      {actionError && <p className="form-error">{actionError}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : (
        <div className="qr-token-list">
          {QR_TYPES.map((type) => {
            const token = tokenByType.get(type);
            return (
              <div className="qr-token-row" key={type}>
                <div>
                  <strong>{type}</strong>
                  {token ? (
                    <>
                      {' '}
                      <StatusBadge status={token.status} /> <span className="form-help">issued {formatDateTime(token.issuedAt)}</span>
                    </>
                  ) : (
                    <span className="form-help"> not issued yet</span>
                  )}
                </div>
                <div className="row-actions">
                  {token && token.status === 'ACTIVE' && (
                    <button type="button" className="btn-link" disabled={busy === type} onClick={() => revoke(token)}>
                      Revoke
                    </button>
                  )}
                  <button type="button" className="btn-link" disabled={busy === type} onClick={() => rotate(type)}>
                    {token ? 'Rotate (revoke + reissue)' : 'Issue'}
                  </button>
                </div>
              </div>
            );
          })}
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

export function TicketsPage() {
  const [page, setPage] = useState(1);
  const [qrTicket, setQrTicket] = useState<Ticket | null>(null);
  const [historyTicket, setHistoryTicket] = useState<Ticket | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<Ticket>(
    '/admin/tickets',
    page,
  );

  const handleDownloadPdf = async (ticket: Ticket) => {
    setBusyId(ticket.id);
    setActionError(null);
    try {
      await downloadTicketPdf(ticket.id, ticket.ticketNumber);
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleReissuePdf = async (ticket: Ticket) => {
    const reason = window.prompt('Reason for reissuing this ticket PDF (kept in its version history):');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setActionError('A reason of at least 3 characters is required.');
      return;
    }
    setBusyId(ticket.id);
    setActionError(null);
    try {
      await apiClient.post(`/admin/tickets/${ticket.id}/reissue-pdf`, { reason: reason.trim() });
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleResendEmail = async (ticket: Ticket) => {
    setBusyId(ticket.id);
    setActionError(null);
    try {
      await apiClient.post(`/admin/tickets/${ticket.id}/resend-email`);
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const tableColumns: Column<Ticket>[] = [
    ...columns,
    {
      key: '__actions',
      label: '',
      width: '420px',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn-link" onClick={() => setQrTicket(row)}>
            Manage QR
          </button>
          <button type="button" className="btn-link" disabled={busyId === row.id} onClick={() => handleDownloadPdf(row)}>
            Download PDF
          </button>
          <button type="button" className="btn-link" disabled={busyId === row.id} onClick={() => handleReissuePdf(row)}>
            Reissue PDF
          </button>
          <button type="button" className="btn-link" onClick={() => setHistoryTicket(row)}>
            History
          </button>
          <button type="button" className="btn-link" disabled={busyId === row.id} onClick={() => handleResendEmail(row)}>
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
          <h1>Tickets</h1>
          <p className="page-description">Tickets are automatically issued when a registration is confirmed.</p>
        </div>
      </div>

      {actionError && <p className="form-error">{actionError}</p>}

      <Table columns={tableColumns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />

      {qrTicket && <QrTokensModal ticket={qrTicket} onClose={() => setQrTicket(null)} />}
      {historyTicket && <TicketHistoryModal ticket={historyTicket} onClose={() => setHistoryTicket(null)} />}
    </div>
  );
}
