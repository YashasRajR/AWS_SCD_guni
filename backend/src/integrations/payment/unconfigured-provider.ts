import { PaymentProviderNotConfiguredError, type PaymentProvider } from './index.js';

/**
 * Honest fallback used whenever the Razorpay credentials are not set. It
 * never fabricates an order or a "success" — a client redirect claiming
 * success is not payment confirmation, and neither is a fake order id.
 * Every webhook is rejected too, since there is no real secret to verify
 * it against.
 */
export class UnconfiguredPaymentProvider implements PaymentProvider {
  readonly name = 'unconfigured';

  // async so this rejects the returned Promise rather than throwing
  // synchronously — matters to callers that only guard the awaited call.
  async createOrder(_input: {
    registrationId: string;
    amount: string;
    currency: string;
  }): Promise<{ providerOrderId: string }> {
    throw new PaymentProviderNotConfiguredError(
      'Online payment is not configured on this server yet.',
    );
  }

  verifyWebhookSignature(_rawBody: string, _signature: string): boolean {
    return false;
  }
}
