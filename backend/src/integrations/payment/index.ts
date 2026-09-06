import { getEnv } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { RazorpayPaymentProvider } from './razorpay-provider.js';
import { UnconfiguredPaymentProvider } from './unconfigured-provider.js';

/**
 * Payment provider integration boundary. Business logic in
 * modules/payments never talks to a concrete SDK/provider directly — it
 * only calls this interface, so the provider can be swapped later without
 * touching call sites. `createOrder` starts a checkout server-side; the
 * payer completes it on the provider's own page/widget, and the provider
 * calls our webhook asynchronously. A client-reported "success" redirect
 * is never trusted as payment confirmation on its own.
 */
export interface PaymentProvider {
  readonly name: string;
  createOrder(input: {
    registrationId: string;
    amount: string;
    currency: string;
  }): Promise<{ providerOrderId: string }>;
  /** True only if `signature` is a valid signature of `rawBody` under our webhook secret. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  /**
   * Live gateway status for an order (spec #36 "view gateway status" /
   * "retry verification") -- used when our own row may be stale (a lost
   * webhook), not as a replacement for the webhook flow.
   */
  fetchOrderStatus(providerOrderId: string): Promise<{
    providerPaymentId: string | null;
    status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded' | null;
  }>;
  /** Initiates a refund at the gateway for an already-captured payment. */
  refundPayment(providerPaymentId: string, amount: string): Promise<{ providerRefundId: string }>;
}

/**
 * Thrown by UnconfiguredPaymentProvider — a distinct type so callers can
 * tell "not configured" apart from a real provider-side failure (network
 * error, bad request) and respond to each differently.
 */
export class PaymentProviderNotConfiguredError extends Error {}

let cachedProvider: PaymentProvider | undefined;

/**
 * Picks the real Razorpay provider when PAYMENT_PROVIDER_KEY is
 * configured, else falls back to a provider that refuses to create orders
 * rather than faking one. Cached for the process lifetime like getPool()/getEnv().
 */
export function getPaymentProvider(): PaymentProvider {
  if (!cachedProvider) {
    const env = getEnv();
    if (env.PAYMENT_PROVIDER_KEY && env.PAYMENT_PROVIDER_SECRET) {
      cachedProvider = new RazorpayPaymentProvider();
    } else {
      logger.warn(
        'PAYMENT_PROVIDER_KEY/PAYMENT_PROVIDER_SECRET are not configured — payment initiation will be refused rather than faked. Set them in .env to accept real payments.',
      );
      cachedProvider = new UnconfiguredPaymentProvider();
    }
  }
  return cachedProvider;
}

/** Test-only: lets tests reset the cached singleton between provider configurations. */
export function resetPaymentProviderCache(): void {
  cachedProvider = undefined;
}
