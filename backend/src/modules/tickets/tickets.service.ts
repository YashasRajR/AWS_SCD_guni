import type { Ticket } from '@scd/types';
import { ticketsRepository } from './tickets.repository.js';
import { toTicket } from './tickets.types.js';
import { qrTokensService } from '../qr-tokens/qr-tokens.service.js';

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
    const row = existing ?? (await ticketsRepository.issue(registrationId));

    // issueForTicket is idempotent per type — a re-confirm that hits the
    // `existing` branch above still backfills QR tokens if an earlier call
    // never got that far, and is a no-op once both types exist.
    await qrTokensService.issueForTicket(row.id);

    return toTicket(row);
  },
};
