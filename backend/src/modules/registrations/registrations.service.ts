import type { PaginatedData, Registration } from '@scd/types';
import type { UpdateRegistrationStatusInput } from '@scd/validation';
import { registrationsRepository } from './registrations.repository.js';
import { toRegistration } from './registrations.types.js';
import { eventService } from '../event/event.service.js';
import { ticketsService } from '../tickets/tickets.service.js';
import { attendeesService } from '../attendees/attendees.service.js';
import { usersService } from '../users/users.service.js';
import { emailsService } from '../emails/emails.service.js';
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

  async list(page: number, pageSize: number): Promise<PaginatedData<Registration>> {
    const { rows, total } = await registrationsRepository.list(page, pageSize);
    return {
      items: rows.map(toRegistration),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  /**
   * Self-service — an attendee registering themselves for the event.
   * One registration per attendee (this platform is single-edition this
   * phase, so "the event" is unambiguous — see docs/architecture). Honors
   * the event's registration window when one is configured.
   */
  async create(attendeeId: string): Promise<Registration> {
    const existing = await registrationsRepository.findByAttendeeId(attendeeId);
    if (existing) throw AppError.duplicate('You are already registered for this event.');

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

    // The findByAttendeeId check above is not race-safe on its own — two
    // simultaneous submits can both pass it before either INSERT lands.
    // registrations_attendee_id_unique (see database/migrations/033) is
    // the real backstop: catch its violation here and surface the same
    // clean 409 instead of a raw constraint error.
    try {
      const row = await registrationsRepository.create(attendeeId);
      return toRegistration(row);
    } catch (err) {
      if ((err as PgError).code === '23505') {
        throw AppError.duplicate('You are already registered for this event.');
      }
      throw err;
    }
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
      await this.notifyConfirmed(row.attendee_id, row.registration_number, ticket.ticketNumber);
    }
    return toRegistration(row);
  },

  /**
   * Best-effort: looked up via each module's own service (not repository
   * directly), per the established module-boundary convention. A missing
   * attendee/user or an enqueue failure is logged and swallowed rather than
   * failing the status update itself — the registration/ticket are already
   * committed by this point, and emailsService.enqueue() never throws.
   */
  async notifyConfirmed(attendeeId: string, registrationNumber: string, ticketNumber: string): Promise<void> {
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
    await emailsService.enqueue(user.id, user.email, 'ticket', 'Your AWS Student Community Day ticket', {
      fullName: attendee.fullName,
      registrationNumber,
      ticketNumber,
    });
  },
};
