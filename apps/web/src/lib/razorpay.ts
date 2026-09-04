/**
 * Loads Razorpay's Checkout widget script on demand (never bundled — it's a
 * third-party script that must come straight from Razorpay) and opens it.
 *
 * Completion here means the *browser checkout UI* reported success or
 * cancellation — it is never treated as payment confirmation. Only the
 * backend's Razorpay webhook confirms a payment (see
 * backend/src/modules/payments/payments.service.ts). After `onSuccess`
 * fires here, the caller must re-fetch payment status from the API rather
 * than assume anything.
 */

interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let loadPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Could not load the payment checkout. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });
  return loadPromise;
}

export async function openRazorpayCheckout(options: {
  keyId: string;
  orderId: string;
  amount: string;
  currency: string;
  onSuccess: () => void;
  onDismiss: () => void;
}): Promise<void> {
  await loadCheckoutScript();
  if (!window.Razorpay) {
    throw new Error('Could not load the payment checkout. Check your connection and try again.');
  }
  const amountMinorUnits = Math.round(Number(options.amount) * 100);
  const instance = new window.Razorpay({
    key: options.keyId,
    amount: amountMinorUnits,
    currency: options.currency,
    order_id: options.orderId,
    name: 'AWS Student Community Day 2026',
    description: 'Event registration',
    handler: () => options.onSuccess(),
    modal: { ondismiss: () => options.onDismiss() },
    theme: { color: '#FF9900' },
  });
  instance.open();
}
