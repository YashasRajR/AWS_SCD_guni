/**
 * Payment provider integration boundary. NOT implemented in this phase —
 * `PAYMENT_PROVIDER_KEY` / `PAYMENT_WEBHOOK_SECRET` are read from env but
 * unused. A real adapter (Razorpay/Stripe/etc.) implements this interface
 * in the payment implementation phase; `modules/payments` calls it, not a
 * concrete SDK, so the provider stays swappable.
 */
export interface PaymentProvider {
  createOrder(input: { registrationId: string; amount: string; currency: string }): Promise<{
    providerOrderId: string;
  }>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}
