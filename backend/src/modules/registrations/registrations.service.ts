import type { PaginatedData, Registration } from '@scd/types';
import type { UpdateRegistrationStatusInput } from '@scd/validation';
import { registrationsRepository } from './registrations.repository.js';
import { toCsv } from '../../utils/csv.js';
import { toRegistration } from './registrations.types.js';
import { eventService } from '../event/event.service.js';
import { ticketPlansService } from '../ticket-plans/ticket-plans.service.js';
import { couponsService } from '../coupons/coupons.service.js';
import { ticketsService, formatAmountPaid } from '../tickets/tickets.service.js';
import { attendeesService } from '../attendees/attendees.service.js';
import { usersService } from '../users/users.service.js';
import { emailsService } from '../emails/emails.service.js';
import { sheetsSyncService } from '../sheets-sync/sheets-sync.service.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/errors.js';

interface PgError {
  code?: string;
}

export const registrationsService = {
  async getByAttendeeId(attendeeId: string): Promise<Registration | null> {
    const row = await registrationsRepository.findByAttendeeId(attendeeId);
    return row ? toRegistration(row) : null;
  },

  async getById(id: string): Promise<Registration | null> {
    const row = await registrationsRepository.findById(id);
    return row ? toRegistration(row) : null;
  },

  async exportCsv(): Promise<string> {
    const rows = await registrationsRepository.listForExport();
    return toCsv(
      [
        'Registration #',
        'Status',
        'Full name',
        'Email',
        'Phone',
        'University',
        'Department',
        'Year',
        'Ticket plan',
        'Coupon code',
        'Discount amount',
        'Registered at',
        'Confirmed at',
        'Payment status',
        'Payment amount',
        'Payment currency',
      ],
      rows.map((r) => [
        r.registration_number,
        r.status,
        r.full_name,
        r.email,
        r.phone,
        r.university,
        r.department,
        r.year,
        r.ticket_plan_name,
        r.coupon_code,
        r.discount_amount,
        r.registered_at,
        r.confirmed_at,
        r.payment_status,
        r.payment_amount,
        r.payment_currency,
      ]),
    );
  },

  async list(page: number, pageSize: number, search?: string): Promise<PaginatedData<Registration>> {
    const { rows, total } = await registrationsRepository.list(page, pageSize, search);
    return {
      items: rows.map(toRegistration),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  /**
   * Self-service — an attendee registering themselves for the event under
   * a specific ticket plan (see ticket-plans module). One registration per
   * attendee (this platform is single-edition this phase, so "the event"
   * is unambiguous — see docs/architecture). Honors the event's
   * registration window when one is configured.
   */
  async create(attendeeId: string, ticketPlanCode: string, couponCode?: string): Promise<Registration> {
    const existing = await registrationsRepository.findByAttendeeId(attendeeId);
    if (existing) throw AppError.duplicate('You are already registered for this event.');

    const plan = await ticketPlansService.requireActiveByCode(ticketPlanCode);

    const event = await eventService.getCurrent().catch(() => null);
    if (event) {
      const now = Date.now();
      if (event.registrationOpen && new Date(event.registrationOpen).getTime() > now) {
        throw AppError.validation('Registration has not opened yet.');
      }
      if (event.registrationClose && new Date(event.registrationClose).getTime() < now) {
        throw AppError.validation('Registration has closed.');
      }
    }

    // Priced (and, on success, redeemed below) BEFORE the registration row
    // exists — an invalid/expired/exhausted coupon must never leave a
    // registration behind with no discount applied.
    const pricing = couponCode
      ? await couponsService.price(couponCode, Number(plan.price), plan.currency, plan.id, attendeeId)
      : null;

    // The findByAttendeeId check above is not race-safe on its own — two
    // simultaneous submits can both pass it before either INSERT lands.
    // registrations_attendee_id_unique (see database/migrations/033) is
    // the real backstop: catch its violation here and surface the same
    // clean 409 instead of a raw constraint error.
    let row;
    try {
      row = await registrationsRepository.create(
        attendeeId,
        plan.id,
        pricing?.couponId ?? null,
        pricing?.discountAmount ?? '0',
      );
    } catch (err) {
      if ((err as PgError).code === '23505') {
        throw AppError.duplicate('You are already registered for this event.');
      }
      // registration_number_seq hit its MAXVALUE of 999 (spec #20's hard cap).
      if ((err as PgError).code === '2200H') {
        throw AppError.validation('Registration capacity for this event has been reached.');
      }
      throw err;
    }
    if (pricing) {
      await couponsService.recordUsage(pricing.couponId, attendeeId, row.id, pricing.discountAmount);
    }
    return toRegistration(row);
  },

  /**
   * Change a registration's status — called both by an admin (manual
   * confirm/waitlist/cancel/reject) and by the payments webhook (automatic
   * confirm on a captured payment). Confirming issues a ticket the first
   * time it happens. Only a transition *into* CONFIRMED triggers the
   * ticket + emails — re-confirming an already-CONFIRMED registration
   * (a retried webhook, a redundant admin click) is a no-op for those
   * side effects, so callers never need their own idempotency guard.
   */
  async updateStatus(id: string, input: UpdateRegistrationStatusInput): Promise<Registration> {
    const before = await registrationsRepository.findById(id);
    if (!before) throw AppError.notFound('Registration');

    const row = await registrationsRepository.updateStatus(id, input.status);
    if (!row) throw AppError.notFound('Registration');

    if (row.status === 'CONFIRMED' && before.status !== 'CONFIRMED') {
      const ticket = await ticketsService.issueIfNeeded(row.id);
      await this.notifyConfirmed(row.id, row.attendee_id, row.registration_number, ticket.id, ticket.ticketNumber);
      await sheetsSyncService.enqueue('REGISTRATION', row.id);
    } else if (row.status === 'WAITLISTED' && before.status !== 'WAITLISTED') {
      await this.notifyWaitlisted(row.attendee_id, row.registration_number);
    } else if (row.status === 'REJECTED' && before.status !== 'REJECTED') {
      await this.notifyRejected(row.attendee_id, row.registration_number);
    }
    return toRegistration(row);
  },

  /**
   * Shared by notifyWaitlisted/notifyRejected below — same lookup +
   * missing-attendee/user handling notifyConfirmed already does. Returns
   * null (and logs why) instead of throwing, since a missing
   * attendee/user should never block the status change itself.
   */
  async getNotifiableUser(
    attendeeId: string,
  ): Promise<{ fullName: string; userId: string; email: string } | null> {
    const attendee = await attendeesService.getById(attendeeId);
    if (!attendee) {
      logger.warn({ attendeeId }, 'Registration status change has no matching attendee — skipping email');
      return null;
    }
    const user = await usersService.getPublicUserById(attendee.userId);
    if (!user) {
      logger.warn({ attendeeId, userId: attendee.userId }, 'Attendee has no matching user — skipping email');
      return null;
    }
    return { fullName: attendee.fullName, userId: user.id, email: user.email };
  },

  async notifyWaitlisted(attendeeId: string, registrationNumber: string): Promise<void> {
    const recipient = await this.getNotifiableUser(attendeeId);
    if (!recipient) return;
    await emailsService.enqueue(
      recipient.userId,
      recipient.email,
      'waitlisted',
      "You're on the waitlist",
      { fullName: recipient.fullName, registrationNumber },
    );
  },

  async notifyRejected(attendeeId: string, registrationNumber: string): Promise<void> {
    const recipient = await this.getNotifiableUser(attendeeId);
    if (!recipient) return;
    await emailsService.enqueue(
      recipient.userId,
      recipient.email,
      'registration-rejected',
      'Update on your registration',
      { fullName: recipient.fullName, registrationNumber },
    );
  },

  /**
   * Best-effort: looked up via each module's own service (not repository
   * directly), per the established module-boundary convention. A missing
   * attendee/user or an enqueue failure is logged and swallowed rather than
   * failing the status update itself — the registration/ticket are already
   * committed by this point, and emailsService.enqueue() never throws.
   */
  async notifyConfirmed(
    registrationId: string,
    attendeeId: string,
    registrationNumber: string,
    ticketId: string,
    ticketNumber: string,
  ): Promise<void> {
    const attendee = await attendeesService.getById(attendeeId);
    if (!attendee) {
      logger.warn({ attendeeId }, 'Confirmed registration has no matching attendee — skipping email');
      return;
    }
    const user = await usersService.getPublicUserById(attendee.userId);
    if (!user) {
      logger.warn({ attendeeId, userId: attendee.userId }, 'Confirmed attendee has no matching user — skipping email');
      return;
    }
    await emailsService.enqueue(
      user.id,
      user.email,
      'registration-confirmation',
      'Your registration is confirmed',
      { fullName: attendee.fullName, registrationNumber },
    );

    // Best-effort enrichment for the ticket email's richer layout -- a
    // failure here still sends the (plainer) email rather than blocking
    // the confirmed registration on it.
    const [registrationRow, event] = await Promise.all([
      registrationsRepository.findById(registrationId),
      eventService.getCurrent(),
    ]);
    await emailsService.enqueue(user.id, user.email, 'ticket', 'Your AWS Student Community Day ticket', {
      fullName: attendee.fullName,
      registrationNumber,
      ticketNumber,
      ticketId,
      registrationId,
      ticketPlanName: registrationRow?.tp_name ?? null,
      amountLabel: registrationRow ? formatAmountPaid(registrationRow, event) : null,
      phone: attendee.phone,
      issuedAt: new Date().toISOString(),
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue,
      supportEmail: event.contactEmail,
    });
  },
};
