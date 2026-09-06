import { useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  Attendee,
  Certificate,
  Checkpoint,
  CouponPricing,
  EventConfig,
  Payment,
  PublicUser,
  Registration,
  Ticket,
  TicketPlan,
} from '@scd/types';
import { ApiClientError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { formatDateTime, statusTone } from '../lib/format.js';
import { openRazorpayCheckout } from '../lib/razorpay.js';
import { Badge } from '../components/ui/Badge.js';
import { useDocumentHead } from '../lib/seo.js';

interface MeData {
  user: PublicUser;
  attendee: Attendee | null;
}

interface ProgressItem {
  checkpoint: Checkpoint;
  completed: boolean;
  completedAt: string | null;
}

/** Shared "this section failed to load" fallback — every dashboard card renders
 * its own error state instead of silently showing nothing, per the platform's
 * "every page must have an error state" requirement. */
function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="status-line form-error">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn-link" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { data: me, loading: meLoading, error: meError, reload: reloadMe } = useResource<MeData>('/me');
  const {
    data: registration,
    loading: regLoading,
    error: regError,
    reload: reloadRegistration,
  } = useResource<Registration>('/me/registration');
  const {
    data: ticket,
    error: ticketError,
    reload: reloadTicket,
  } = useResource<Ticket>('/me/ticket', Boolean(registration));
  const {
    items: progress,
    error: progressError,
    reload: reloadProgress,
  } = useResource<ProgressItem>('/me/progress');
  const {
    items: certificates,
    error: certificatesError,
    reload: reloadCertificates,
  } = useResource<Certificate>('/me/certificates');
  const {
    items: achievements,
    error: achievementsError,
    reload: reloadAchievements,
  } = useResource<unknown>('/me/achievements');
  const { data: event } = useResource<EventConfig>('/event');
  const { items: ticketPlans } = useResource<TicketPlan>('/ticket-plans');
  const {
    data: payment,
    error: paymentError,
    reload: reloadPayment,
  } = useResource<Payment>('/me/payment', Boolean(registration));

  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponPricing, setCouponPricing] = useState<CouponPricing | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);

  const handleApplyCoupon = async () => {
    if (!selectedPlanCode || !couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    setCouponPricing(null);
    try {
      const pricing = await apiClient.post<CouponPricing>('/me/coupons/preview', {
        ticketPlanCode: selectedPlanCode,
        couponCode: couponCode.trim(),
      });
      setCouponPricing(pricing);
    } catch (err) {
      setCouponError(err instanceof ApiClientError ? err.message : 'Could not apply that coupon.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedPlanCode) {
      setRegisterError('Pick a ticket type first.');
      return;
    }
    setRegistering(true);
    setRegisterError(null);
    try {
      await apiClient.post('/me/registration', {
        ticketPlanCode: selectedPlanCode,
        couponCode: couponPricing ? couponCode.trim() : undefined,
      });
      reloadRegistration();
    } catch (err) {
      setRegisterError(err instanceof ApiClientError ? err.message : 'Failed to register.');
    } finally {
      setRegistering(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const result = await apiClient.post<{ payment: Payment; providerOrderId: string; providerKey: string }>(
        '/me/payment/initiate',
        {},
      );
      await openRazorpayCheckout({
        keyId: result.providerKey,
        orderId: result.providerOrderId,
        amount: result.payment.amount,
        currency: result.payment.currency,
        onSuccess: () => {
          // The checkout UI reported success, but only the backend webhook
          // confirms a payment — reload from the API rather than assume.
          setCheckoutPending(true);
          reloadPayment();
        },
        onDismiss: () => setPaying(false),
      });
    } catch (err) {
      setPayError(err instanceof ApiClientError ? err.message : 'Could not start payment.');
      setPaying(false);
    }
  };

  const requiresPayment = registration?.ticketPlan
    ? Number(registration.ticketPlan.price) > 0
    : event
      ? Number(event.registrationFee) > 0
      : false;
  const completedCount = progress.filter((p) => p.completed).length;

  useDocumentHead({ title: 'My Dashboard' });

  return (
    <div className="page-section dashboard">
      <header className="page-section-header">
        <h1>My dashboard</h1>
        {!meLoading && !meError && me?.attendee && (
          <p className="page-section-lede">
            {me.attendee.fullName}
            {me.attendee.university ? ` · ${me.attendee.university}` : ''}
          </p>
        )}
        {!meLoading && meError && <SectionError message={meError} onRetry={reloadMe} />}
      </header>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>Event registration</h2>
          {regLoading ? (
            <p className="status-line">Loading…</p>
          ) : regError ? (
            <SectionError message={regError} onRetry={reloadRegistration} />
          ) : registration ? (
            <>
              <p className="dashboard-card-row">
                <Badge tone={statusTone(registration.status)}>{registration.status}</Badge>
                <span className="dashboard-card-meta">#{registration.registrationNumber}</span>
              </p>
              {registration.status === 'PENDING' && (
                <p className="status-line">Your registration is awaiting confirmation from the organizing team.</p>
              )}
              {registration.status === 'CONFIRMED' && registration.confirmedAt && (
                <p className="status-line">Confirmed {formatDateTime(registration.confirmedAt)}.</p>
              )}
              {registration.status === 'WAITLISTED' && (
                <p className="status-line">You&apos;re on the waitlist — we&apos;ll notify you if a spot opens up.</p>
              )}
              {(registration.status === 'CANCELLED' || registration.status === 'REJECTED') && (
                <p className="status-line">
                  This registration was {registration.status.toLowerCase()}. Contact the organizing team with any
                  questions.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="status-line">You haven&apos;t registered for the event yet.</p>
              {ticketPlans.length > 0 && (
                <label className="form-field">
                  <span>Ticket type</span>
                  <select
                    value={selectedPlanCode}
                    onChange={(e) => {
                      setSelectedPlanCode(e.target.value);
                      setCouponPricing(null);
                      setCouponError(null);
                    }}
                  >
                    <option value="">Select a ticket type…</option>
                    {ticketPlans.map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {plan.name} — {plan.currency} {plan.price}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {selectedPlanCode && (
                <div className="dashboard-card-row">
                  <label className="form-field" style={{ flex: 1 }}>
                    <span>Coupon code (optional)</span>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponPricing(null);
                        setCouponError(null);
                      }}
                      placeholder="e.g. AWSGUNI25"
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                  >
                    {applyingCoupon ? 'Applying…' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && <p className="form-error">{couponError}</p>}
              {couponPricing && (
                <p className="status-line">
                  {couponPricing.currency} {couponPricing.originalAmount} − {couponPricing.currency}{' '}
                  {couponPricing.discountAmount} = <strong>{couponPricing.currency} {couponPricing.finalAmount}</strong>
                </p>
              )}
              {registerError && <p className="form-error">{registerError}</p>}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRegister}
                disabled={registering || (ticketPlans.length > 0 && !selectedPlanCode)}
              >
                {registering ? 'Registering…' : 'Register for the event'}
              </button>
            </>
          )}
        </section>

        {requiresPayment && registration && registration.status === 'PENDING' && (
          <section className="dashboard-card">
            <h2>Payment</h2>
            {paymentError ? (
              <SectionError message={paymentError} onRetry={reloadPayment} />
            ) : payment?.status === 'PAID' ? (
              <>
                <Badge tone="success">PAID</Badge>
                <p className="status-line">
                  Paid {payment.paidAt ? formatDateTime(payment.paidAt) : ''}. Your registration will be confirmed
                  shortly.
                </p>
              </>
            ) : (
              <>
                <p className="dashboard-card-row">
                  <Badge tone={statusTone(payment?.status ?? 'PENDING')}>{payment?.status ?? 'PENDING'}</Badge>
                  <span className="dashboard-card-meta">
                    {registration?.ticketPlan
                      ? `${registration.ticketPlan.currency} ${(
                          Number(registration.ticketPlan.price) - Number(registration.discountAmount)
                        ).toFixed(2)}${
                          Number(registration.discountAmount) > 0
                            ? ` (${registration.coupon?.code} applied)`
                            : ''
                        }`
                      : `${event?.currency} ${event?.registrationFee}`}
                  </span>
                </p>
                {checkoutPending && (
                  <p className="status-line">
                    Payment submitted — confirming with the payment provider. This can take a minute; refresh to
                    check.
                  </p>
                )}
                {payError && <p className="form-error">{payError}</p>}
                <button type="button" className="btn btn-primary" onClick={handlePay} disabled={paying}>
                  {paying ? 'Opening checkout…' : 'Pay now'}
                </button>
              </>
            )}
          </section>
        )}

        <section className="dashboard-card">
          <h2>Ticket</h2>
          {ticketError ? (
            <SectionError message={ticketError} onRetry={reloadTicket} />
          ) : ticket ? (
            <>
              <p className="dashboard-card-row">
                <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
                <span className="dashboard-card-meta">#{ticket.ticketNumber}</span>
              </p>
              <p className="status-line">Issued {formatDateTime(ticket.issuedAt)}.</p>
            </>
          ) : (
            <p className="status-line">
              Your ticket will appear here once your registration is confirmed.
            </p>
          )}
        </section>

        <section className="dashboard-card">
          <h2>Checkpoint progress</h2>
          {progressError ? (
            <SectionError message={progressError} onRetry={reloadProgress} />
          ) : progress.length === 0 ? (
            <p className="status-line">Checkpoints haven&apos;t been set up yet.</p>
          ) : (
            <>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress.length ? (completedCount / progress.length) * 100 : 0}%` }}
                />
              </div>
              <p className="status-line">
                {completedCount} of {progress.length} completed
              </p>
              <ul className="checkpoint-list">
                {progress.map((p) => (
                  <li key={p.checkpoint.id} className={p.completed ? 'checkpoint-done' : ''}>
                    <span>{p.completed ? '✓' : '○'}</span> {p.checkpoint.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="dashboard-card">
          <h2>Certificates</h2>
          {certificatesError ? (
            <SectionError message={certificatesError} onRetry={reloadCertificates} />
          ) : certificates.length === 0 ? (
            <p className="status-line">No certificates yet — these are issued after the event.</p>
          ) : (
            <ul className="checkpoint-list">
              {certificates.map((c) => (
                <li key={c.id}>
                  {c.title} <span className="dashboard-card-meta">#{c.certificateNumber}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card">
          <h2>Achievements</h2>
          {achievementsError ? (
            <SectionError message={achievementsError} onRetry={reloadAchievements} />
          ) : (
            <p className="status-line">
              {achievements.length === 0
                ? 'No achievements unlocked yet.'
                : `${achievements.length} unlocked.`}
            </p>
          )}
          <Link to="/dashboard/achievements" className="btn-link">
            View achievements →
          </Link>
        </section>

        <section className="dashboard-card">
          <h2>Quick links</h2>
          <ul className="dashboard-links">
            <li><Link to="/dashboard/profile">My profile</Link></li>
            <li><Link to="/dashboard/achievements">Achievements</Link></li>
            <li><Link to="/dashboard/certificates">Certificates</Link></li>
            <li><Link to="/dashboard/wrapped">Event wrapped</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
