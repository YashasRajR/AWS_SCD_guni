import type { Payment } from '@scd/types';
import { paymentsRepository } from './payments.repository.js';
import { toPayment } from './payments.types.js';

/**
 * Service boundary only in this phase — no live payment gateway. The real
 * `initiatePayment` / `handleWebhook` methods that talk to a provider are
 * added in the payments implementation phase.
 */
export const paymentsService = {
  async getByRegistrationId(registrationId: string): Promise<Payment | null> {
    const row = await paymentsRepository.findByRegistrationId(registrationId);
    return row ? toPayment(row) : null;
  },
};
