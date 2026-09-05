import { useState } from 'react';
import type { QrToken, QrTokenType, Ticket } from '@scd/types';
import { describeApiError } from '@scd/api-client';
import { usePaginatedResource, useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
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
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<Ticket>(
    '/admin/tickets',
    page,
  );

  const tableColumns: Column<Ticket>[] = [
    ...columns,
    {
      key: '__actions',
      label: '',
      width: '160px',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn-link" onClick={() => setQrTicket(row)}>
            Manage QR
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

      <Table columns={tableColumns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />

      {qrTicket && <QrTokensModal ticket={qrTicket} onClose={() => setQrTicket(null)} />}
    </div>
  );
}
