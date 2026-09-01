import type { PaginatedData, Registration } from '@scd/types';
import type { UpdateRegistrationStatusInput } from '@scd/validation';
import { registrationsRepository } from './registrations.repository.js';
import { toRegistration } from './registrations.types.js';
import { eventService } from '../event/event.service.js';
import { ticketsService } from '../tickets/tickets.service.js';
import { AppError } from '../../utils/errors.js';

export const registrationsService = {
  async getByAttendeeId(attendeeId: string): Promise<Registration | null> {
    const row = await registrationsRepository.findByAttendeeId(attendeeId);
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

    const row = await registrationsRepository.create(attendeeId);
    return toRegistration(row);
  },

  /**
   * Admin: change a registration's status (e.g. confirm, waitlist, cancel,
   * reject). Confirming issues a ticket the first time it happens — there
   * is no payment gateway yet (see database/schema/payments.sql), so
   * confirmation is the sole trigger for ticket issuance this phase.
   */
  async updateStatus(id: string, input: UpdateRegistrationStatusInput): Promise<Registration> {
    const row = await registrationsRepository.updateStatus(id, input.status);
    if (!row) throw AppError.notFound('Registration');
    if (row.status === 'CONFIRMED') {
      await ticketsService.issueIfNeeded(row.id);
    }
    return toRegistration(row);
  },
};
