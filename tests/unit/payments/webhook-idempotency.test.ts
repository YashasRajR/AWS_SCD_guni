import { describe, expect, it, vi, beforeEach } from 'vitest';

const {
  PAYMENTS_REPO_PATH,
  PAYMENT_PROVIDER_PATH,
  REGISTRATIONS_SERVICE_PATH,
  ATTENDEES_SERVICE_PATH,
  USERS_SERVICE_PATH,
  EMAILS_SERVICE_PATH,
  EVENT_SERVICE_PATH,
} = vi.hoisted(() => ({
  PAYMENTS_REPO_PATH: '../../../backend/src/modules/payments/payments.repository.js',
  PAYMENT_PROVIDER_PATH: '../../../backend/src/integrations/payment/index.js',
  REGISTRATIONS_SERVICE_PATH: '../../../backend/src/modules/registrations/registrations.service.js',
  ATTENDEES_SERVICE_PATH: '../../../backend/src/modules/attendees/attendees.service.js',
  USERS_SERVICE_PATH: '../../../backend/src/modules/users/users.service.js',
  EMAILS_SERVICE_PATH: '../../../backend/src/modules/emails/emails.service.js',
  EVENT_SERVICE_PATH: '../../../backend/src/modules/event/event.service.js',
}));

vi.mock(PAYMENTS_REPO_PATH, () => ({
  paymentsRepository: {
    findByProviderOrderId: vi.fn(),
    markPaid: vi.fn(),
    markFailed: vi.fn(),
    findByRegistrationId: vi.fn(),
    recordWebhookEventIfNew: vi.fn(),
    markWebhookEventProcessed: vi.fn(),
  },
}));
vi.mock(PAYMENT_PROVIDER_PATH, () => ({
  getPaymentProvider: vi.fn(),
  PaymentProviderNotConfiguredError: class PaymentProviderNotConfiguredError extends Error {},
}));
vi.mock(REGISTRATIONS_SERVICE_PATH, () => ({
  registrationsService: { updateStatus: vi.fn(), getById: vi.fn() },
}));
vi.mock(ATTENDEES_SERVICE_PATH, () => ({
  attendeesService: { getById: vi.fn() },
}));
vi.mock(USERS_SERVICE_PATH, () => ({
  usersService: { getPublicUserById: vi.fn() },
}));
vi.mock(EMAILS_SERVICE_PATH, () => ({
  emailsService: { enqueue: vi.fn() },
}));
vi.mock(EVENT_SERVICE_PATH, () => ({
  eventService: { getCurrent: vi.fn() },
}));

const { paymentsRepository } = await import(PAYMENTS_REPO_PATH);
const { getPaymentProvider } = await import(PAYMENT_PROVIDER_PATH);
const { registrationsService } = await import(REGISTRATIONS_SERVICE_PATH);
const { paymentsService } =
  await import('../../../backend/src/modules/payments/payments.service.js');

function mockProvider(verifies: boolean) {
  vi.mocked(getPaymentProvider).mockReturnValue({
    name: 'razorpay',
    verifyWebhookSignature: vi.fn().mockReturnValue(verifies),
    createOrder: vi.fn(),
  });
}

describe('paymentsService.handleWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: this is a new event delivery, not a duplicate.
    vi.mocked(paymentsRepository.recordWebhookEventIfNew).mockResolvedValue('event-id-1');
  });

  it('rejects a webhook with an invalid signature and never touches the payment', async () => {
    mockProvider(false);
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: {} } },
    });

    await expect(paymentsService.handleWebhook(body, 'bad-signature')).rejects.toThrow(
      /invalid webhook signature/i,
    );
    expect(paymentsRepository.findByProviderOrderId).not.toHaveBeenCalled();
  });

  it('rejects a webhook with a missing signature', async () => {
    mockProvider(true);
    const body = JSON.stringify({ event: 'payment.captured' });
    await expect(paymentsService.handleWebhook(body, undefined)).rejects.toThrow(
      /invalid webhook signature/i,
    );
  });

  it('ignores a webhook for an order id it has no record of', async () => {
    mockProvider(true);
    vi.mocked(paymentsRepository.findByProviderOrderId).mockResolvedValue(null);
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_unknown' } } },
    });

    await paymentsService.handleWebhook(body, 'sig');

    expect(paymentsRepository.markPaid).not.toHaveBeenCalled();
  });

  it('marks a PENDING payment PAID and confirms the registration on payment.captured', async () => {
    mockProvider(true);
    vi.mocked(paymentsRepository.findByProviderOrderId).mockResolvedValue({
      id: 'payment-1',
      status: 'PENDING',
      registration_id: 'registration-1',
    });
    vi.mocked(paymentsRepository.markPaid).mockResolvedValue({
      id: 'payment-1',
      status: 'PAID',
      registration_id: 'registration-1',
    });
    vi.mocked(registrationsService.getById).mockResolvedValue(null); // short-circuits notifyPaymentResult
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } },
    });

    await paymentsService.handleWebhook(body, 'sig');

    expect(paymentsRepository.markPaid).toHaveBeenCalledWith('payment-1', 'pay_1');
    expect(registrationsService.updateStatus).toHaveBeenCalledWith('registration-1', {
      status: 'CONFIRMED',
    });
  });

  it('is idempotent: a second payment.captured delivery for an already-PAID payment is a silent no-op', async () => {
    mockProvider(true);
    vi.mocked(paymentsRepository.findByProviderOrderId).mockResolvedValue({
      id: 'payment-1',
      status: 'PAID',
      registration_id: 'registration-1',
    });
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } },
    });

    await paymentsService.handleWebhook(body, 'sig');

    expect(paymentsRepository.markPaid).not.toHaveBeenCalled();
    expect(registrationsService.updateStatus).not.toHaveBeenCalled();
  });

  it('does not let a payment.failed webhook overwrite an already-PAID payment', async () => {
    mockProvider(true);
    vi.mocked(paymentsRepository.findByProviderOrderId).mockResolvedValue({
      id: 'payment-1',
      status: 'PAID',
      registration_id: 'registration-1',
    });
    const body = JSON.stringify({
      event: 'payment.failed',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } },
    });

    await paymentsService.handleWebhook(body, 'sig');

    expect(paymentsRepository.markFailed).not.toHaveBeenCalled();
  });

  it('rejects a duplicate webhook delivery at the database layer, before touching the payment', async () => {
    mockProvider(true);
    vi.mocked(paymentsRepository.recordWebhookEventIfNew).mockResolvedValue(null); // already seen
    vi.mocked(paymentsRepository.findByProviderOrderId).mockResolvedValue({
      id: 'payment-1',
      status: 'PENDING',
      registration_id: 'registration-1',
    });
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } },
    });

    await paymentsService.handleWebhook(body, 'sig');

    expect(paymentsRepository.markPaid).not.toHaveBeenCalled();
    expect(registrationsService.updateStatus).not.toHaveBeenCalled();
  });

  it('throws on a malformed JSON payload instead of silently ignoring it', async () => {
    mockProvider(true);
    await expect(paymentsService.handleWebhook('not json', 'sig')).rejects.toThrow(
      /malformed webhook payload/i,
    );
  });
});
