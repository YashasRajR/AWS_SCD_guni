import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Attendee, CouponPricing, PublicUser, Registration, Ticket, TicketPlan } from '@scd/types';
import { ApiClientError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { Badge } from '../components/ui/Badge.js';
import { statusTone } from '../lib/format.js';
import { useDocumentHead } from '../lib/seo.js';

interface MeData {
  user: PublicUser;
  attendee: Attendee | null;
}

/**
 * The only path between account creation and the dashboard. Registration
 * is free (ticketing/payment is handled externally via KonfHub), so
 * submitting here confirms the registration immediately -- no checkout
 * step. For a brand new attendee (no registration row yet) this is the
 * plan review + coupon screen; "Confirm registration" creates the row and
 * the backend confirms it in the same request. The dashboard route guard
 * (App.tsx's RequireConfirmedRegistration) sends anyone without a
 * CONFIRMED registration back here.
 */
export function CompleteRegistrationPage() {
  useDocumentHead({ title: 'Complete your registration' });
  const navigate = useNavigate();
  const location = useLocation();
  const ticketPlanCodeFromRegister = (location.state as { ticketPlanCode?: string } | null)?.ticketPlanCode;

  const {
    data: registration,
    loading: regLoading,
    notFound: regNotFound,
    error: regError,
    reload: reloadRegistration,
  } = useResource<Registration>('/me/registration');
  // Only needed before a registration exists, to show the chosen plan's
  // name/price on the review screen -- real data, not fabricated.
  const { items: ticketPlans } = useResource<TicketPlan>('/ticket-plans', regNotFound);
  // Only needed once confirmed, for the success screen below.
  const isConfirmed = registration?.status === 'CONFIRMED';
  const { data: me } = useResource<MeData>('/me', isConfirmed);
  const { data: ticket } = useResource<Ticket>('/me/ticket', isConfirmed);

  const [couponCode, setCouponCode] = useState(() => {
    try {
      const urlCoupon = new URLSearchParams(window.location.search).get('coupon');
      if (urlCoupon) return urlCoupon.trim();
      return localStorage.getItem('scd_saved_coupon') || '';
    } catch {
      return '';
    }
  });
  const [couponPricing, setCouponPricing] = useState<CouponPricing | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // No registration and no plan to create one from (direct link, or the
  // state was lost on a refresh) -- nothing to review, send them to pick
  // a plan rather than guessing one.
  useEffect(() => {
    if (regLoading || registration || !regNotFound) return;
    if (!ticketPlanCodeFromRegister) {
      navigate('/register', { replace: true });
    }
  }, [regLoading, registration, regNotFound, ticketPlanCodeFromRegister, navigate]);

  // Distinguishes "just registered, show the success screen" from "landed
  // here already confirmed" (e.g. a stale bookmark) -- only the latter
  // should bounce straight to the dashboard with no confirmation shown.
  const sawUnconfirmed = useRef(false);
  useEffect(() => {
    if (registration && registration.status !== 'CONFIRMED') {
      sawUnconfirmed.current = true;
    }
  }, [registration]);

  useEffect(() => {
    if (registration?.status === 'CONFIRMED' && !sawUnconfirmed.current) {
      navigate('/dashboard', { replace: true });
    }
  }, [registration, navigate]);

  const [resendingTicket, setResendingTicket] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResendTicket = async () => {
    setResendingTicket(true);
    setResendError(null);
    setResendMessage(null);
    try {
      await apiClient.post('/me/ticket/resend-email', {});
      setResendMessage('Ticket email resent.');
    } catch (err) {
      setResendError(err instanceof ApiClientError ? err.message : 'Could not resend that email.');
    } finally {
      setResendingTicket(false);
    }
  };

  const plan = ticketPlans.find((p) => p.code === ticketPlanCodeFromRegister);

  const handleApplyCoupon = async () => {
    if (!ticketPlanCodeFromRegister || !couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    setCouponPricing(null);
    try {
      const pricing = await apiClient.post<CouponPricing>('/me/coupons/preview', {
        ticketPlanCode: ticketPlanCodeFromRegister,
        couponCode: couponCode.trim(),
      });
      setCouponPricing(pricing);
    } catch (err) {
      setCouponError(err instanceof ApiClientError ? err.message : 'Could not apply that coupon.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleConfirm = async () => {
    if (!ticketPlanCodeFromRegister) return;
    setCreating(true);
    setCreateError(null);
    try {
      await apiClient.post('/me/registration', {
        ticketPlanCode: ticketPlanCodeFromRegister,
        couponCode: couponPricing ? couponCode.trim() : undefined,
      });
      reloadRegistration();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to register for the event.');
    } finally {
      setCreating(false);
    }
  };

  if (regLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="status-line">Loading…</p>
        </div>
      </div>
    );
  }

  if (regError && !registration && !regNotFound) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Something went wrong</h1>
          <p className="form-error">{regError}</p>
          <button type="button" className="btn btn-primary" onClick={() => reloadRegistration()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Just registered this session -- show the confirmation screen instead
  // of silently landing on the dashboard (spec #04A step 3).
  if (registration?.status === 'CONFIRMED') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>You're registered!</h1>
          <p className="auth-subtitle">Your registration is confirmed.</p>

          <div className="dashboard-card-review">
            {me?.attendee && (
              <p className="dashboard-card-row">
                <span>Name</span>
                <span className="dashboard-card-meta">{me.attendee.fullName}</span>
              </p>
            )}
            <p className="dashboard-card-row">
              <span>Registration #</span>
              <span className="dashboard-card-meta">{registration.registrationNumber}</span>
            </p>
            {ticket && (
              <p className="dashboard-card-row">
                <span>Ticket ID</span>
                <span className="dashboard-card-meta">{ticket.ticketNumber}</span>
              </p>
            )}
            {me?.user && (
              <p className="dashboard-card-row">
                <span>Sent to</span>
                <span className="dashboard-card-meta">{me.user.email}</span>
              </p>
            )}
          </div>

          <p className="status-line">
            Your ticket (with both QR codes) is being emailed to the address above. This can take a few minutes.
          </p>

          {resendMessage && <p className="status-line">{resendMessage}</p>}
          {resendError && <p className="form-error">{resendError}</p>}

          <div className="dashboard-card-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResendTicket}
              disabled={resendingTicket || !ticket?.pdfAvailable}
            >
              {resendingTicket ? 'Resending…' : "Didn't get it? Resend ticket email"}
            </button>
          </div>

          <Link to="/dashboard" className="btn btn-primary btn-block" style={{ marginTop: '1rem' }}>
            Go to dashboard →
          </Link>
        </div>
      </div>
    );
  }

  // No registration yet: plan + coupon review, then confirm.
  if (!registration) {
    if (!ticketPlanCodeFromRegister) {
      return (
        <div className="auth-page">
          <div className="auth-card">
            <p className="status-line">Loading…</p>
          </div>
        </div>
      );
    }
    const currency = couponPricing?.currency ?? plan?.currency ?? '';
    const originalAmount = couponPricing ? couponPricing.originalAmount : (plan?.price ?? '0');
    const discountAmount = couponPricing?.discountAmount ?? 0;
    const finalAmount = couponPricing ? couponPricing.finalAmount : originalAmount;
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Complete your registration</h1>
          <p className="auth-subtitle">Review your plan, then confirm.</p>

          <div className="dashboard-card-review">
            <p className="dashboard-card-row">
              <span>{plan?.name ?? 'Registration'}</span>
              <span className="dashboard-card-meta">{plan?.currency} {plan?.price}</span>
            </p>

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
                  placeholder="e.g. AWS-SCD-P2026"
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
            {!couponCode && (
              <div style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => setCouponCode('AWS-SCD-P2026')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--primary, #232F3E)',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  📋 Paste Cloud Quest coupon &ldquo;AWS-SCD-P2026&rdquo;
                </button>
              </div>
            )}
            {couponError && <p className="form-error">{couponError}</p>}

            {Number(discountAmount) > 0 && (
              <p className="dashboard-card-row">
                <span>Coupon discount ({couponCode.trim()})</span>
                <span className="dashboard-card-meta">− {currency} {discountAmount}</span>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setCouponCode('');
                    setCouponPricing(null);
                    setCouponError(null);
                  }}
                >
                  Remove
                </button>
              </p>
            )}
            <p className="dashboard-card-row">
              <strong>Total due</strong>
              <strong>{currency} {finalAmount}</strong>
            </p>

            {createError && <p className="form-error">{createError}</p>}
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleConfirm}
              disabled={creating}
            >
              {creating ? 'Confirming…' : 'Confirm registration'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Non-CONFIRMED states are admin-driven -- reflect the real status
  // rather than showing a form that can't do anything here. PENDING is
  // unreachable in practice (registration confirms immediately on
  // creation) but kept as an honest fallback.
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Registration {registration.status.toLowerCase()}</h1>
        <Badge tone={statusTone(registration.status)}>{registration.status}</Badge>
        <p className="status-line">
          {registration.status === 'PENDING' && 'Your registration is being processed.'}
          {registration.status === 'WAITLISTED' &&
            'You are on the waitlist for this event. We will email you if a spot opens up.'}
          {registration.status === 'CANCELLED' && 'This registration has been cancelled.'}
          {registration.status === 'REJECTED' && 'This registration was not approved.'}
        </p>
      </div>
    </div>
  );
}
