import { createHmac, timingSafeEqual } from 'node:crypto';
import { getEnv } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { PaymentProvider } from './index.js';

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

/**
 * Constant-time HMAC-SHA256 hex comparison. Exported standalone so it's
 * independently unit-testable without a network call or a live secret.
 */
export function verifyHmacSha256Hex(rawBody: string, signatureHex: string, secret: string): boolean {
  if (!/^[0-9a-f]+$/i.test(signatureHex)) return false;
  const expectedHex = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(signatureHex, 'hex');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

/**
 * Talks to Razorpay's REST API directly with fetch() rather than pulling
 * in the razorpay SDK — this integration only needs two simple
 * authenticated HTTP calls (create order, verify webhook signature), not
 * a full client library.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = 'razorpay';

  async createOrder(input: {
    registrationId: string;
    amount: string;
    currency: string;
  }): Promise<{ providerOrderId: string }> {
    const env = getEnv();
    const auth = Buffer.from(`${env.PAYMENT_PROVIDER_KEY}:${env.PAYMENT_PROVIDER_SECRET}`).toString(
      'base64',
    );
    // Razorpay expects the smallest currency unit (e.g. paise for INR) as an integer.
    const amountMinorUnits = Math.round(Number(input.amount) * 100);
    if (!Number.isFinite(amountMinorUnits) || amountMinorUnits <= 0) {
      throw new Error(`Invalid payment amount: ${input.amount}`);
    }

    const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountMinorUnits,
        currency: input.currency,
        receipt: input.registrationId,
        notes: { registrationId: input.registrationId },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error({ status: res.status, body }, 'Razorpay order creation failed');
      throw new Error(`Payment provider rejected the order request (HTTP ${res.status}).`);
    }

    const data = (await res.json()) as { id: string };
    return { providerOrderId: data.id };
  }

  /** Razorpay signs webhook bodies with HMAC-SHA256 under PAYMENT_WEBHOOK_SECRET, sent as `X-Razorpay-Signature`. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const env = getEnv();
    if (!env.PAYMENT_WEBHOOK_SECRET) return false;
    try {
      return verifyHmacSha256Hex(rawBody, signature, env.PAYMENT_WEBHOOK_SECRET);
    } catch {
      return false;
    }
  }

  private authHeader(): string {
    const env = getEnv();
    return `Basic ${Buffer.from(`${env.PAYMENT_PROVIDER_KEY}:${env.PAYMENT_PROVIDER_SECRET}`).toString('base64')}`;
  }

  /**
   * Lists the payment attempts against an order and returns the most
   * recent one's status -- used when our own row may be stale (a lost
   * webhook) rather than trusted as the primary confirmation path.
   */
  async fetchOrderStatus(providerOrderId: string): Promise<{
    providerPaymentId: string | null;
    status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded' | null;
  }> {
    const res = await fetch(`${RAZORPAY_API_BASE}/orders/${providerOrderId}/payments`, {
      headers: { Authorization: this.authHeader() },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error({ status: res.status, body, providerOrderId }, 'Razorpay order-status lookup failed');
      throw new Error(`Payment provider rejected the status request (HTTP ${res.status}).`);
    }
    const data = (await res.json()) as { items: { id: string; status: string }[] };
    // Attempts are returned oldest-first; the most recent one reflects the
    // order's current state (a retried checkout can have an earlier
    // failed attempt followed by a later captured one).
    const latest = data.items[data.items.length - 1];
    if (!latest) return { providerPaymentId: null, status: null };
    return { providerPaymentId: latest.id, status: latest.status as 'created' | 'authorized' | 'captured' | 'failed' | 'refunded' };
  }

  async refundPayment(providerPaymentId: string, amount: string): Promise<{ providerRefundId: string }> {
    const amountMinorUnits = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountMinorUnits) || amountMinorUnits <= 0) {
      throw new Error(`Invalid refund amount: ${amount}`);
    }
    const res = await fetch(`${RAZORPAY_API_BASE}/payments/${providerPaymentId}/refund`, {
      method: 'POST',
      headers: { Authorization: this.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountMinorUnits }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error({ status: res.status, body, providerPaymentId }, 'Razorpay refund failed');
      throw new Error(`Payment provider rejected the refund request (HTTP ${res.status}).`);
    }
    const data = (await res.json()) as { id: string };
    return { providerRefundId: data.id };
  }
}
