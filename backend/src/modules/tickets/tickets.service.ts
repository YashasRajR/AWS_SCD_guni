import type { Ticket } from '@scd/types';
import { ticketsRepository } from './tickets.repository.js';
import { toTicket } from './tickets.types.js';

export const ticketsService = {
  async getByRegistrationId(registrationId: string): Promise<Ticket | null> {
    const row = await ticketsRepository.findByRegistrationId(registrationId);
    return row ? toTicket(row) : null;
  },

  /**
   * Issues a ticket the first time a registration is confirmed; a second
   * call for the same registration returns the already-issued ticket
   * rather than erroring (registrations can be re-confirmed idempotently).
   */
  async issueIfNeeded(registrationId: string): Promise<Ticket> {
    const existing = await ticketsRepository.findByRegistrationId(registrationId);
    if (existing) return toTicket(existing);
    return toTicket(await ticketsRepository.issue(registrationId));
  },
};
