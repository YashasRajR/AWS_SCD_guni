import type { PaginatedData, Payment } from '@scd/types';
import { paymentsRepository } from './payments.repository.js';
import { toCsv } from '../../utils/csv.js';
import { toPayment, type PaymentRow } from './payments.types.js';
import { getEnv } from '../../config/env.js';
import { getPaymentProvider, PaymentProviderNotConfiguredError } from '../../integrations/payment/index.js';
import { attendeesService } from '../attendees/attendees.service.js';
import { usersService } from '../users/users.service.js';
import { registrationsService } from '../registrations/registrations.service.js';
import { eventService } from '../event/event.service.js';
import { emailsService } from '../emails/emails.service.js';
import { logger } from '../../utils/logger.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { AppError } from '../../utils/errors.js';

export interface InitiatePaymentResult {
  payment: Payment;
  providerOrderId: string;
  /** Razorpay's public "key id" half of the credential pair — safe to hand to the checkout widget. */
  providerKey: string;
}

/** Defensively-parsed shape of the fields this integration reads from a Razorpay webhook payload. */
interface RazorpayWebhookPayload {
  /** Razorpay includes a top-level event delivery id on most accounts; not
   * guaranteed present on every plan/version, so we always fall back to a
   * deterministic key derived from the payload itself (see
   * webhookEventIdFor below) rather than depending on it. */
  id?: string;
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
  };
}

/**
 * A stable identifier for this exact webhook delivery, used as the
 * database dedup key. Prefers the provider's own delivery id when present;
 * otherwise derives one from the event type + payment/order id, which is
 * still enough to catch the common case (the provider retrying the exact
 * same delivery after a timeout).
 */
function webhookEventIdFor(parsed: RazorpayWebhookPayload, orderId: string): string {
  if (parsed.id) return parsed.id;
  const entity = parsed.payload?.payment?.entity;
  return `${parsed.event ?? 'unknown'}:${entity?.id ?? 'no-payment-id'}:${orderId}`;
}

export const paymentsService = {
  async getByRegistrationId(registrationId: string): Promise<Payment | null> {
    const row = await paymentsRepository.findByRegistrationId(registrationId);
    return row ? toPayment(row) : null;
  },

  async exportCsv(): Promise<string> {
    const rows = await paymentsRepository.listForExport();
    return toCsv(
      ['Registration #', 'Full name', 'Email', 'Provider', 'Amount', 'Currency', 'Status', 'Paid at', 'Created at'],
      rows.map((r) => [
        r.registration_number,
        r.full_name,
        r.email,
        r.provider,
        r.amount,
        r.currency,
        r.status,
        r.paid_at,
        r.created_at,
      ]),
    );
  },

  async list(page: number, pageSize: number): Promise<PaginatedData<Payment>> {
    const { rows, total } = await paymentsRepository.list(page, pageSize);
    return {
      items: rows.map(toPayment),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  /**
   * Attendee-initiated — starts a checkout for the attendee's own PENDING
   * registration. This only ever creates a provider order for the
   * frontend checkout widget to open; it never marks anything paid. Only
   * the provider's own webhook (handleWebhook) is trusted to confirm
   * payment — a client reporting "success" after checkout is not treated
   * as confirmation.
   */
  async initiatePayment(attendeeId: string): Promise<InitiatePaymentResult> {
    const registration = await registrationsService.getByAttendeeId(attendeeId);
    if (!registration) throw AppError.notFound('Registration');
    if (registration.status !== 'PENDING') {
      throw AppError.validation('Only a pending registration can be paid for.');
    }

    // Priced from the ticket plan the attendee selected at registration
    // time, minus whatever coupon discount was locked in at that same
    // moment — never the event's flat legacy `registrationFee` (kept only
    // for events with no plans configured at all).
    const plan = registration.ticketPlan;
    const event = plan ? null : await eventService.getCurrent();
    const basePrice = Number(plan ? plan.price : event!.registrationFee);
    const fee = Math.max(0, basePrice - Number(registration.discountAmount));
    if (!(fee > 0)) {
      throw AppError.validation('This event does not require payment.');
    }
    const currency = plan ? plan.currency : event!.currency;

    const existing = await paymentsRepository.findByRegistrationId(registration.id);
    if (existing?.status === 'PAID') {
      throw AppError.duplicate('This registration has already been paid for.');
    }
    // Reuse an in-flight PENDING/PROCESSING payment row instead of creating
    // a duplicate one every time the attendee reopens checkout; a
    // previously FAILED attempt gets a fresh row.
    const payment =
      existing && existing.status !== 'FAILED'
        ? existing
        : await paymentsRepository.createPending(registration.id, String(fee), currency);

    const provider = getPaymentProvider();
    let providerOrderId: string;
    try {
      const order = await provider.createOrder({
        registrationId: registration.id,
        amount: payment.amount,
        currency: payment.currency,
      });
      providerOrderId = order.providerOrderId;
    } catch (err) {
      if (err instanceof PaymentProviderNotConfiguredError) {
        throw AppError.paymentProviderUnavailable(err.message);
      }
      logger.error({ err, registrationId: registration.id }, 'Payment order creation failed');
      throw AppError.internal('Could not start the payment. Please try again.');
    }

    const updated = await paymentsRepository.attachProviderOrder(payment.id, provider.name, providerOrderId);
    return {
      payment: toPayment(updated),
      providerOrderId,
      providerKey: getEnv().PAYMENT_PROVIDER_KEY,
    };
  },

  /**
   * The only place a payment is ever marked PAID/FAILED. Requires a valid
   * provider signature over the exact raw request body (see
   * payments.controller.ts / server/app.ts for how that raw body is
   * captured). Idempotent: a provider's webhook can and will retry a
   * delivery, so a payment already in a terminal state is a silent no-op
   * rather than re-confirming a registration or re-sending emails.
   */
  async handleWebhook(rawBody: string, signature: string | undefined): Promise<void> {
    const provider = getPaymentProvider();
    if (!signature || !provider.verifyWebhookSignature(rawBody, signature)) {
      throw AppError.forbidden('Invalid webhook signature.');
    }

    let parsed: RazorpayWebhookPayload;
    try {
      parsed = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch {
      throw AppError.validation('Malformed webhook payload.');
    }

    const entity = parsed.payload?.payment?.entity;
    const orderId = entity?.order_id;
    const providerPaymentId = entity?.id;
    if (!orderId) {
      logger.warn({ event: parsed.event }, 'Payment webhook missing order id — ignoring');
      return;
    }

    const payment = await paymentsRepository.findByProviderOrderId(provider.name, orderId);

    // Database-enforced dedup: insert the event row first. A NULL id back
    // means (provider, providerEventId) already existed — this exact
    // delivery was already received (e.g. the provider retried it), so it
    // is a no-op regardless of what the payment's current status says.
    const eventId = await paymentsRepository.recordWebhookEventIfNew({
      provider: provider.name,
      providerEventId: webhookEventIdFor(parsed, orderId),
      eventType: parsed.event ?? 'unknown',
      paymentId: payment?.id ?? null,
    });
    if (!eventId) {
      logger.info({ orderId, event: parsed.event }, 'Duplicate payment webhook delivery — ignoring');
      return;
    }

    if (!payment) {
      logger.warn({ orderId, event: parsed.event }, 'Payment webhook references an unknown order — ignoring');
      await paymentsRepository.markWebhookEventProcessed(eventId, 'IGNORED', 'Unknown provider order id');
      return;
    }

    if (parsed.event === 'payment.captured') {
      if (payment.status === 'PAID') {
        await paymentsRepository.markWebhookEventProcessed(eventId, 'IGNORED', 'Payment already PAID');
        return;
      }
      const updated = await paymentsRepository.markPaid(payment.id, providerPaymentId ?? orderId);
      await registrationsService.updateStatus(updated.registration_id, { status: 'CONFIRMED' });
      await this.notifyPaymentResult(updated, true);
      await paymentsRepository.markWebhookEventProcessed(eventId, 'PROCESSED');
      await auditLogsService.logSystem('PAYMENT_CONFIRMED', 'payment', updated.id, {
        registrationId: updated.registration_id,
        provider: provider.name,
      });
    } else if (parsed.event === 'payment.failed') {
      if (payment.status === 'FAILED' || payment.status === 'PAID') {
        await paymentsRepository.markWebhookEventProcessed(eventId, 'IGNORED', `Payment already ${payment.status}`);
        return;
      }
      const updated = await paymentsRepository.markFailed(payment.id);
      await this.notifyPaymentResult(updated, false);
      await paymentsRepository.markWebhookEventProcessed(eventId, 'PROCESSED');
      await auditLogsService.logSystem('PAYMENT_FAILED', 'payment', updated.id, {
        registrationId: updated.registration_id,
        provider: provider.name,
      });
    } else {
      logger.info({ event: parsed.event }, 'Ignoring unhandled payment webhook event type');
      await paymentsRepository.markWebhookEventProcessed(eventId, 'IGNORED', 'Unhandled event type');
    }
  },

  /** Best-effort — looked up via each module's own service, same pattern as registrations.service.ts's notifyConfirmed. */
  async notifyPaymentResult(payment: PaymentRow, success: boolean): Promise<void> {
    const registration = await registrationsService.getById(payment.registration_id);
    if (!registration) return;
    const attendee = await attendeesService.getById(registration.attendeeId);
    if (!attendee) return;
    const user = await usersService.getPublicUserById(attendee.userId);
    if (!user) return;

    if (success) {
      await emailsService.enqueue(user.id, user.email, 'payment-success', 'Payment received', {
        fullName: attendee.fullName,
      });
    } else {
      await emailsService.enqueue(user.id, user.email, 'payment-failed', 'Payment unsuccessful', {
        fullName: attendee.fullName,
      });
    }
  },
};
