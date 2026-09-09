import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PaymentDetail } from '@scd/types';
import { describeApiError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { StatusBadge } from '../components/StatusBadge.js';

export function PaymentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useResource<PaymentDetail>(`/admin/payments/${id}`);
  const [gatewayStatus, setGatewayStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  if (loading) return <p>Loading…</p>;
  if (error || !data) return <p className="form-error">{error ?? 'Not found.'}</p>;

  const { payment, registrationNumber, attendeeName, attendeeEmail, couponCode } = data;

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

  const checkGatewayStatus = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const result = await apiClient.get<{ providerPaymentId: string | null; status: string | null }>(
        `/admin/payments/${id}/gateway-status`,
      );
      setGatewayStatus(result.status ?? 'unknown');
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const retryVerification = () =>
    run('Verification retried.', () => apiClient.post(`/admin/payments/${id}/retry-verification`, {}));

  const refund = () => {
    if (
      !window.confirm(
        `Refund ${payment.currency} ${payment.amount} paid by ${attendeeName ?? 'this attendee'} (registration ${registrationNumber ?? '—'})?`,
      )
    ) {
      return;
    }
    const reason = window.prompt('Reason for this refund (kept in the audit log):');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setActionError('A reason of at least 3 characters is required.');
      return;
    }
    void run('Refund initiated.', () => apiClient.post(`/admin/payments/${id}/refund`, { reason: reason.trim() }));
  };

  const reconcile = (status: 'PAID' | 'FAILED' | 'REFUNDED') => {
    if (
      !window.confirm(
        `Mark this ${payment.currency} ${payment.amount} payment for ${attendeeName ?? 'this attendee'} (registration ${registrationNumber ?? '—'}) as ${status}?`,
      )
    ) {
      return;
    }
    const reason = window.prompt(
      `Reason for manually marking this payment ${status} (kept in the audit log):`,
    );
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setActionError('A reason of at least 3 characters is required.');
      return;
    }
    void run(`Marked ${status}.`, () =>
      apiClient.post(`/admin/payments/${id}/reconcile`, { status, reason: reason.trim() }),
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button type="button" className="btn-link" onClick={() => navigate('/payments')}>
            ← Back to payments
          </button>
          <h1>
            {payment.currency} {payment.amount}
          </h1>
          <p className="page-description">
            {attendeeName ?? 'Unknown attendee'} {attendeeEmail && `(${attendeeEmail})`} — registration{' '}
            {registrationNumber ?? '—'}
          </p>
        </div>
      </div>

      {actionError && <p className="form-error">{actionError}</p>}
      {actionNote && <p className="form-help">{actionNote}</p>}

      <section className="panel">
        <h2>Transaction details</h2>
        <dl className="detail-list">
          <dt>Status</dt>
          <dd>
            <StatusBadge status={payment.status} />
          </dd>
          <dt>Provider</dt>
          <dd>{payment.provider ?? '—'}</dd>
          <dt>Provider order ID</dt>
          <dd>{payment.providerOrderId ?? '—'}</dd>
          <dt>Provider payment ID</dt>
          <dd>{payment.providerPaymentId ?? '—'}</dd>
          <dt>Coupon</dt>
          <dd>{couponCode ?? '—'}</dd>
          <dt>Paid at</dt>
          <dd>{formatDateTime(payment.paidAt)}</dd>
          <dt>Created</dt>
          <dd>{formatDateTime(payment.createdAt)}</dd>
        </dl>
      </section>

      <section className="panel">
        <h2>Gateway status</h2>
        <p className="form-help">{gatewayStatus ? `Gateway reports: ${gatewayStatus}` : 'Not checked yet.'}</p>
        <div className="row-actions">
          <button type="button" className="btn-link" disabled={busy} onClick={checkGatewayStatus}>
            Check gateway status
          </button>
          {(payment.status === 'PENDING' || payment.status === 'PROCESSING') && (
            <button type="button" className="btn-link" disabled={busy} onClick={retryVerification}>
              Retry verification
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Refund</h2>
        {payment.refundedAt ? (
          <dl className="detail-list">
            <dt>Refunded at</dt>
            <dd>{formatDateTime(payment.refundedAt)}</dd>
            <dt>Refund amount</dt>
            <dd>{payment.refundAmount ?? '—'}</dd>
            <dt>Gateway refund ID</dt>
            <dd>{payment.refundProviderId ?? 'Manual (no gateway record)'}</dd>
          </dl>
        ) : (
          <p className="form-help">No refund recorded.</p>
        )}
        {payment.status === 'PAID' && (
          <button type="button" onClick={refund} disabled={busy}>
            Initiate refund
          </button>
        )}
      </section>

      <section className="panel">
        <h2>Manual reconciliation</h2>
        <p className="form-help">
          Records a status change with a mandatory reason, audited under your admin identity. Use this only when
          the gateway can't confirm a payment itself (e.g. a bank transfer).
        </p>
        <div className="row-actions">
          {payment.status !== 'PAID' && (
            <button type="button" className="btn-link" disabled={busy} onClick={() => reconcile('PAID')}>
              Mark PAID
            </button>
          )}
          {payment.status !== 'FAILED' && (
            <button type="button" className="btn-link" disabled={busy} onClick={() => reconcile('FAILED')}>
              Mark FAILED
            </button>
          )}
          {payment.status !== 'REFUNDED' && (
            <button type="button" className="btn-link" disabled={busy} onClick={() => reconcile('REFUNDED')}>
              Mark REFUNDED
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
