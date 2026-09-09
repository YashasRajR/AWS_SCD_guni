import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CouponPricing, Payment, Registration, TicketPlan } from '@scd/types';
import { ApiClientError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { openRazorpayCheckout } from '../lib/razorpay.js';
import { Badge } from '../components/ui/Badge.js';
import { statusTone } from '../lib/format.js';
import { useDocumentHead } from '../lib/seo.js';

/**
 * The only path between account creation and the dashboard. For a brand
 * new attendee (no registration row yet), this is the checkout screen:
 * plan, optional coupon, then "Confirm & Pay" creates the registration
 * (locking in the coupon, if any -- registrationsService.create prices and
 * redeems it before the row exists, so a coupon can never be applied
 * after) and opens Razorpay. The dashboard route guard (App.tsx's
 * RequirePaidRegistration) sends anyone without a CONFIRMED registration
 * back here, so this is also where someone lands if they closed the
 * checkout window and come back later -- at that point the registration
 * (and any coupon on it) already exists, so it's just a "pay now" screen.
 */
export function CompletePaymentPage() {
  useDocumentHead({ title: 'Complete your payment' });
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
  const {
    error: paymentError,
    reload: reloadPayment,
  } = useResource<Payment>('/me/payment', Boolean(registration));
  // Only needed before a registration exists, to show the chosen plan's
  // name/price on the checkout screen -- real data, not fabricated.
  const { items: ticketPlans } = useResource<TicketPlan>('/ticket-plans', regNotFound);

  const [couponCode, setCouponCode] = useState('');
  const [couponPricing, setCouponPricing] = useState<CouponPricing | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);

  // No registration and no plan to create one from (direct link, or the
  // state was lost on a refresh) -- nothing to check out, send them to
  // pick a plan rather than guessing one.
  useEffect(() => {
    if (regLoading || registration || !regNotFound) return;
    if (!ticketPlanCodeFromRegister) {
      navigate('/register', { replace: true });
    }
  }, [regLoading, registration, regNotFound, ticketPlanCodeFromRegister, navigate]);

  // Already paid -- nothing to do here, the dashboard is the right place.
  useEffect(() => {
    if (registration?.status === 'CONFIRMED') {
      navigate('/dashboard', { replace: true });
    }
  }, [registration, navigate]);

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
          reloadRegistration();
        },
        onDismiss: () => setPaying(false),
      });
    } catch (err) {
      setPayError(err instanceof ApiClientError ? err.message : 'Could not start payment.');
      setPaying(false);
    }
  };

  const handleConfirmAndPay = async () => {
    if (!ticketPlanCodeFromRegister) return;
    setCreating(true);
    setCreateError(null);
    try {
      await apiClient.post('/me/registration', {
        ticketPlanCode: ticketPlanCodeFromRegister,
        couponCode: couponPricing ? couponCode.trim() : undefined,
      });
      reloadRegistration();
      await handlePay();
    } catch (err) {
      setCreateError(err instanceof ApiClientError ? err.message : 'Failed to register for the event.');
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

  // No registration yet: this is the checkout screen -- plan, coupon, pay.
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
          <h1>Complete your payment</h1>
          <p className="auth-subtitle">Review your order, then continue to payment.</p>

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
              onClick={handleConfirmAndPay}
              disabled={creating || paying}
            >
              {creating || paying ? 'Processing…' : `Confirm & Pay ${currency} ${finalAmount}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Non-PENDING, non-CONFIRMED states are admin-driven -- reflect the real
  // status rather than showing a payment form that can't do anything here.
  if (registration.status !== 'PENDING') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Registration {registration.status.toLowerCase()}</h1>
          <Badge tone={statusTone(registration.status)}>{registration.status}</Badge>
          <p className="status-line">
            {registration.status === 'WAITLISTED' &&
              'You are on the waitlist for this event. We will email you if a spot opens up.'}
            {registration.status === 'CANCELLED' && 'This registration has been cancelled.'}
            {registration.status === 'REJECTED' && 'This registration was not approved.'}
          </p>
        </div>
      </div>
    );
  }

  // Registration already exists (a return visit after closing checkout) --
  // the coupon question is already settled, so this is just a pay screen.
  const existingPlan = registration.ticketPlan;
  const dueAmount = existingPlan
    ? (Number(existingPlan.price) - Number(registration.discountAmount)).toFixed(2)
    : '0';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Complete your payment</h1>
        <p className="auth-subtitle">Registration #{registration.registrationNumber}</p>

        <div className="dashboard-card-review">
          <p className="dashboard-card-row">
            <span>{existingPlan?.name ?? 'Registration'}</span>
            <span className="dashboard-card-meta">
              {existingPlan?.currency} {existingPlan?.price}
            </span>
          </p>
          {Number(registration.discountAmount) > 0 && (
            <p className="dashboard-card-row">
              <span>Coupon discount ({registration.coupon?.code})</span>
              <span className="dashboard-card-meta">
                − {existingPlan?.currency} {registration.discountAmount}
              </span>
            </p>
          )}
          <p className="dashboard-card-row">
            <strong>Total due</strong>
            <strong>{existingPlan?.currency} {dueAmount}</strong>
          </p>

          {paymentError && <p className="form-error">{paymentError}</p>}
          {checkoutPending && (
            <p className="status-line">
              Payment submitted — confirming with the payment provider. This can take a minute; refresh to check.
            </p>
          )}
          {payError && <p className="form-error">{payError}</p>}
          <button type="button" className="btn btn-primary btn-block" onClick={handlePay} disabled={paying}>
            {paying ? 'Opening checkout…' : `Pay ${existingPlan?.currency} ${dueAmount} now`}
          </button>
        </div>
      </div>
    </div>
  );
}
