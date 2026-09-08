import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Payment, Registration } from '@scd/types';
import { ApiClientError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { openRazorpayCheckout } from '../lib/razorpay.js';
import { Badge } from '../components/ui/Badge.js';
import { statusTone } from '../lib/format.js';
import { useDocumentHead } from '../lib/seo.js';

/**
 * The only path between account creation and the dashboard. Creates the
 * event registration for the plan chosen on /register (if one doesn't
 * exist yet), then walks the attendee through payment. The dashboard route
 * guard (App.tsx's RequirePaidRegistration) sends anyone without a
 * CONFIRMED registration back here — so this page is also where someone
 * lands if they closed the checkout window and come back later.
 *
 * No coupon field here on purpose: a coupon can only be redeemed at the
 * moment a registration is created (registrationsService.create prices and
 * locks it in before the row exists), and by the time this page can show
 * anything the registration already exists — so there's nothing left to
 * apply a coupon to. Discounts already on the registration (applied at
 * creation) still show below.
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

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);

  // No registration yet -- create it from the plan chosen on /register.
  // If that plan code isn't available (direct link, or the state was lost
  // on a refresh), there's nothing to create it from, so send them back
  // to pick a plan rather than guessing one.
  useEffect(() => {
    if (regLoading || registration || !regNotFound) return;
    if (!ticketPlanCodeFromRegister) {
      navigate('/register', { replace: true });
      return;
    }
    setCreating(true);
    setCreateError(null);
    apiClient
      .post('/me/registration', { ticketPlanCode: ticketPlanCodeFromRegister })
      .then(() => reloadRegistration())
      .catch((err) =>
        setCreateError(err instanceof ApiClientError ? err.message : 'Failed to register for the event.'),
      )
      .finally(() => setCreating(false));
  }, [regLoading, registration, regNotFound, ticketPlanCodeFromRegister, navigate, reloadRegistration]);

  // Already paid -- nothing to do here, the dashboard is the right place.
  useEffect(() => {
    if (registration?.status === 'CONFIRMED') {
      navigate('/dashboard', { replace: true });
    }
  }, [registration, navigate]);

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

  if (regLoading || creating) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="status-line">{creating ? 'Setting up your registration…' : 'Loading…'}</p>
        </div>
      </div>
    );
  }

  if (createError || (regError && !registration)) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Something went wrong</h1>
          <p className="form-error">{createError ?? regError}</p>
          <button type="button" className="btn btn-primary" onClick={() => reloadRegistration()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!registration) {
    // Being created (effect above just kicked off) or redirecting to /register.
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="status-line">Loading…</p>
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

  const plan = registration.ticketPlan;
  const dueAmount = plan ? (Number(plan.price) - Number(registration.discountAmount)).toFixed(2) : '0';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Complete your payment</h1>
        <p className="auth-subtitle">Registration #{registration.registrationNumber}</p>

        <div className="dashboard-card-review">
          <p className="dashboard-card-row">
            <span>{plan?.name ?? 'Registration'}</span>
            <span className="dashboard-card-meta">
              {plan?.currency} {plan?.price}
            </span>
          </p>
          {Number(registration.discountAmount) > 0 && (
            <p className="dashboard-card-row">
              <span>Coupon discount ({registration.coupon?.code})</span>
              <span className="dashboard-card-meta">
                − {plan?.currency} {registration.discountAmount}
              </span>
            </p>
          )}
          <p className="dashboard-card-row">
            <strong>Total due</strong>
            <strong>{plan?.currency} {dueAmount}</strong>
          </p>

          {paymentError && <p className="form-error">{paymentError}</p>}
          {checkoutPending && (
            <p className="status-line">
              Payment submitted — confirming with the payment provider. This can take a minute; refresh to check.
            </p>
          )}
          {payError && <p className="form-error">{payError}</p>}
          <button type="button" className="btn btn-primary btn-block" onClick={handlePay} disabled={paying}>
            {paying ? 'Opening checkout…' : `Pay ${plan?.currency} ${dueAmount} now`}
          </button>
        </div>
      </div>
    </div>
  );
}
