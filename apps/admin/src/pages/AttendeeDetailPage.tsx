import { Fragment, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { AttendeeDetail } from '@scd/types';
import { describeApiError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { getStoredToken } from '../lib/auth-storage.js';
import { formatDateTime } from '../lib/format.js';
import { StatusBadge } from '../components/StatusBadge.js';

/** Same authenticated-blob-download pattern as TicketsPage/InvoicesPage --
 * the PDF endpoints return a raw application/pdf body, not the JSON envelope. */
async function downloadPdf(path: string, filename: string): Promise<void> {
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

interface DocumentVersion {
  id: string;
  version: number;
  reason: string | null;
  createdAt: string;
}

/** Reissue history (spec #35) -- lists the document_versions rows already
 * exposed by the tickets/invoices admin "History" endpoints, reused here
 * instead of a second history view. */
function DocumentVersionHistory({ kind, id }: { kind: 'tickets' | 'invoices'; id: string }) {
  const { data: versions, loading, error } = useResource<DocumentVersion[]>(`/admin/${kind}/${id}/versions`);
  if (loading) return <p className="form-help">Loading history…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!versions || versions.length === 0) {
    return <p className="form-help">No prior versions — never reissued.</p>;
  }
  return (
    <div className="qr-token-list">
      {versions.map((v) => (
        <div className="qr-token-row" key={v.id}>
          <div>
            <strong>Version {v.version}</strong> <span className="form-help">{formatDateTime(v.createdAt)}</span>
            {v.reason && <div className="form-help">{v.reason}</div>}
          </div>
          <button
            type="button"
            className="btn-link"
            onClick={() => downloadPdf(`/admin/${kind}/${id}/versions/${v.version}/pdf`, `${kind}-v${v.version}.pdf`)}
          >
            Download
          </button>
        </div>
      ))}
    </div>
  );
}

const EDITABLE_FIELDS = ['fullName', 'phone', 'university', 'department', 'year', 'registrationType'] as const;
type EditableField = (typeof EDITABLE_FIELDS)[number];
const FIELD_LABELS: Record<EditableField, string> = {
  fullName: 'Full name',
  phone: 'Phone',
  university: 'University',
  department: 'Department',
  year: 'Year',
  registrationType: 'Registration type',
};

export function AttendeeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useResource<AttendeeDetail>(`/admin/attendees/${id}`);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<EditableField, string>>({
    fullName: '',
    phone: '',
    university: '',
    department: '',
    year: '',
    registrationType: '',
  });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  if (loading) return <p>Loading…</p>;
  if (error || !data) return <p className="form-error">{error ?? 'Not found.'}</p>;

  const {
    attendee,
    email,
    registration,
    payment,
    ticket,
    invoice,
    qrTokens,
    checkpointProgress,
    activityHistory,
    documentEmails,
  } = data;
  const archived = Boolean(attendee.deletedAt);

  const startEdit = () => {
    setForm({
      fullName: attendee.fullName,
      phone: attendee.phone ?? '',
      university: attendee.university ?? '',
      department: attendee.department ?? '',
      year: attendee.year ?? '',
      registrationType: attendee.registrationType ?? '',
    });
    setEditing(true);
  };

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    setActionNote(null);
    try {
      await action();
      setActionNote(label);
      reload();
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = () =>
    run('Profile updated.', async () => {
      const patch: Record<string, string> = {};
      for (const key of EDITABLE_FIELDS) {
        if (form[key].trim()) patch[key] = form[key].trim();
      }
      await apiClient.patch(`/admin/attendees/${id}`, patch);
      setEditing(false);
    });

  const archive = () =>
    run('Attendee archived.', () => apiClient.post(`/admin/attendees/${id}/archive`, {}));
  const restore = () =>
    run('Attendee restored.', () => apiClient.post(`/admin/attendees/${id}/restore`, {}));
  const resetAccess = () =>
    run('Password reset email sent and existing sessions revoked.', () =>
      apiClient.post(`/admin/attendees/${id}/reset-access`, {}),
    );

  const resendTicketEmail = () =>
    ticket && run('Ticket email resent.', () => apiClient.post(`/admin/tickets/${ticket.id}/resend-email`));
  const reissueTicket = () => {
    if (!ticket) return;
    const reason = window.prompt('Reason for reissuing this ticket PDF (kept in its version history):');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setActionError('A reason of at least 3 characters is required.');
      return;
    }
    void run('Ticket reissued.', () =>
      apiClient.post(`/admin/tickets/${ticket.id}/reissue-pdf`, { reason: reason.trim() }),
    );
  };
  const resendInvoiceEmail = () =>
    invoice && run('Invoice email resent.', () => apiClient.post(`/admin/invoices/${invoice.id}/resend-email`));
  const regenerateInvoice = () => {
    if (!invoice) return;
    const reason = window.prompt('Reason for regenerating this invoice PDF (kept in its version history):');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setActionError('A reason of at least 3 characters is required.');
      return;
    }
    void run('Invoice regenerated.', () =>
      apiClient.post(`/admin/invoices/${invoice.id}/regenerate`, { reason: reason.trim() }),
    );
  };
  const rotateQr = (type: string) =>
    ticket && run(`${type} QR rotated.`, () => apiClient.post(`/admin/tickets/${ticket.id}/qr-tokens/${type}/rotate`));
  const revokeQr = (tokenId: string, type: string) =>
    run(`${type} QR revoked.`, () => apiClient.delete(`/admin/qr-tokens/${tokenId}`));
  const reverseCheckpoint = (attendanceId: string, name: string) => {
    const reason = window.prompt(`Reason for reversing "${name}" (optional, kept in the audit log):`) ?? undefined;
    void run(`"${name}" reversed.`, () =>
      apiClient.post(`/admin/checkpoints/attendance/${attendanceId}/reverse`, { reason }),
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button type="button" className="btn-link" onClick={() => navigate('/attendees')}>
            ← Back to attendees
          </button>
          <h1>{attendee.fullName}</h1>
          <p className="page-description">
            {email ?? 'No linked email'} {archived && <span className="badge badge-gray">Archived</span>}
          </p>
        </div>
      </div>

      {actionError && <p className="form-error">{actionError}</p>}
      {actionNote && <p className="form-help">{actionNote}</p>}

      <section className="panel">
        <div className="page-header">
          <h2>Profile</h2>
          {!editing && (
            <button type="button" onClick={startEdit} disabled={busy}>
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="form-grid">
            {EDITABLE_FIELDS.map((key) => (
              <label className="form-field" key={key}>
                {FIELD_LABELS[key]}
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </label>
            ))}
            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={saveEdit} disabled={busy}>
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <dl className="detail-list">
            <dt>University</dt>
            <dd>{attendee.university ?? '—'}</dd>
            <dt>Department</dt>
            <dd>{attendee.department ?? '—'}</dd>
            <dt>Year</dt>
            <dd>{attendee.year ?? '—'}</dd>
            <dt>Registration type</dt>
            <dd>{attendee.registrationType ?? '—'}</dd>
            <dt>Phone</dt>
            <dd>{attendee.phone ?? '—'}</dd>
            <dt>Registered</dt>
            <dd>{formatDateTime(attendee.createdAt)}</dd>
          </dl>
        )}
        <div className="form-actions">
          {archived ? (
            <button type="button" onClick={restore} disabled={busy}>
              Restore
            </button>
          ) : (
            <button type="button" onClick={archive} disabled={busy}>
              Archive
            </button>
          )}
          <button type="button" onClick={resetAccess} disabled={busy || !email}>
            Reset account access
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Registration</h2>
        {registration ? (
          <dl className="detail-list">
            <dt>Number</dt>
            <dd>{registration.registrationNumber}</dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={registration.status} />
            </dd>
            <dt>Ticket plan</dt>
            <dd>{registration.ticketPlan?.name ?? '—'}</dd>
            <dt>Coupon</dt>
            <dd>{registration.coupon?.code ?? '—'}</dd>
            <dt>Registered at</dt>
            <dd>{formatDateTime(registration.registeredAt)}</dd>
          </dl>
        ) : (
          <p className="form-help">No registration yet.</p>
        )}
      </section>

      <section className="panel">
        <h2>Payment</h2>
        {payment ? (
          <dl className="detail-list">
            <dt>Amount</dt>
            <dd>
              {payment.currency} {payment.amount}
            </dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={payment.status} />
            </dd>
            <dt>Provider</dt>
            <dd>{payment.provider ?? '—'}</dd>
            <dt>Paid at</dt>
            <dd>{formatDateTime(payment.paidAt)}</dd>
          </dl>
        ) : (
          <p className="form-help">No payment record.</p>
        )}
      </section>

      <section className="panel">
        <h2>Ticket</h2>
        {ticket ? (
          <>
            <dl className="detail-list">
              <dt>Number</dt>
              <dd>{ticket.ticketNumber}</dd>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={ticket.status} />
              </dd>
              <dt>Issued</dt>
              <dd>{formatDateTime(ticket.issuedAt)}</dd>
              <dt>Version</dt>
              <dd>{ticket.version}</dd>
              <dt>Document generated</dt>
              <dd>{ticket.pdfAvailable ? `Yes (${formatDateTime(ticket.pdfGeneratedAt)})` : 'Not yet'}</dd>
            </dl>
            <div className="row-actions">
              <button
                type="button"
                className="btn-link"
                disabled={busy}
                onClick={() => downloadPdf(`/admin/tickets/${ticket.id}/pdf`, `ticket-${ticket.ticketNumber}.pdf`)}
              >
                Download PDF
              </button>
              <button type="button" className="btn-link" disabled={busy} onClick={reissueTicket}>
                Reissue PDF
              </button>
              <button type="button" className="btn-link" disabled={busy} onClick={resendTicketEmail}>
                Resend email
              </button>
            </div>
            <h3>Reissue history</h3>
            <DocumentVersionHistory kind="tickets" id={ticket.id} />
          </>
        ) : (
          <p className="form-help">No ticket issued.</p>
        )}
      </section>

      <section className="panel">
        <h2>Invoice</h2>
        {invoice ? (
          <>
            <dl className="detail-list">
              <dt>Number</dt>
              <dd>{invoice.invoiceNumber}</dd>
              <dt>Amount</dt>
              <dd>
                {invoice.currency} {invoice.amount}
              </dd>
              <dt>Generated</dt>
              <dd>{formatDateTime(invoice.generatedAt)}</dd>
              <dt>Version</dt>
              <dd>{invoice.version}</dd>
            </dl>
            <div className="row-actions">
              <button
                type="button"
                className="btn-link"
                disabled={busy}
                onClick={() => downloadPdf(`/admin/invoices/${invoice.id}/pdf`, `invoice-${invoice.invoiceNumber}.pdf`)}
              >
                Download PDF
              </button>
              <button type="button" className="btn-link" disabled={busy} onClick={regenerateInvoice}>
                Regenerate
              </button>
              <button type="button" className="btn-link" disabled={busy} onClick={resendInvoiceEmail}>
                Resend email
              </button>
            </div>
            <h3>Reissue history</h3>
            <DocumentVersionHistory kind="invoices" id={invoice.id} />
          </>
        ) : (
          <p className="form-help">No invoice issued.</p>
        )}
      </section>

      <section className="panel">
        <h2>QR tokens</h2>
        {qrTokens.length === 0 ? (
          <p className="form-help">None issued yet.</p>
        ) : (
          <div className="qr-token-list">
            {qrTokens.map((t) => (
              <div className="qr-token-row" key={t.id}>
                <div>
                  <strong>{t.type}</strong> <StatusBadge status={t.status} />{' '}
                  <span className="form-help">issued {formatDateTime(t.issuedAt)}</span>
                </div>
                <div className="row-actions">
                  {t.status === 'ACTIVE' && (
                    <button type="button" className="btn-link" disabled={busy} onClick={() => revokeQr(t.id, t.type)}>
                      Revoke
                    </button>
                  )}
                  <button type="button" className="btn-link" disabled={busy} onClick={() => rotateQr(t.type)}>
                    Rotate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Check-in &amp; goodie progress</h2>
        {checkpointProgress.length === 0 ? (
          <p className="form-help">No checkpoints defined for the current event.</p>
        ) : (
          <div className="qr-token-list">
            {checkpointProgress.map((p) => (
              <div className="qr-token-row" key={p.checkpoint.id}>
                <div>
                  <strong>{p.checkpoint.name}</strong>{' '}
                  {p.completed ? (
                    <span className="form-help">completed {formatDateTime(p.completedAt)}</span>
                  ) : (
                    <span className="form-help">not completed</span>
                  )}
                </div>
                {p.completed && p.attendanceId && (
                  <button
                    type="button"
                    className="btn-link"
                    disabled={busy}
                    onClick={() => reverseCheckpoint(p.attendanceId as string, p.checkpoint.name)}
                  >
                    Reverse (correct)
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Document email delivery</h2>
        {documentEmails.length === 0 ? (
          <p className="form-help">No ticket/invoice emails sent yet.</p>
        ) : (
          <dl className="detail-list">
            {documentEmails.map((rec) => (
              <Fragment key={rec.id}>
                <dt>{rec.template}</dt>
                <dd>
                  <StatusBadge status={rec.status} /> <span className="form-help">to {rec.recipient} —</span>{' '}
                  {rec.sentAt ? formatDateTime(rec.sentAt) : (rec.failureReason ?? formatDateTime(rec.createdAt))}
                </dd>
              </Fragment>
            ))}
          </dl>
        )}
      </section>

      <section className="panel">
        <h2>Activity history</h2>
        {activityHistory.length === 0 ? (
          <p className="form-help">No recorded activity.</p>
        ) : (
          <dl className="detail-list">
            {activityHistory.map((log) => (
              <Fragment key={log.id}>
                <dt>{formatDateTime(log.createdAt)}</dt>
                <dd>
                  {log.action} <span className="form-help">({log.entityType})</span>
                </dd>
              </Fragment>
            ))}
          </dl>
        )}
      </section>

      <p className="form-help">
        Payments, tickets, and invoices can also be managed from their own pages:{' '}
        <Link to="/payments">Payments</Link>, <Link to="/tickets">Tickets</Link>,{' '}
        <Link to="/invoices">Invoices</Link>.
      </p>
    </div>
  );
}
