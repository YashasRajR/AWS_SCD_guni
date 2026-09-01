import type { EmailTemplate } from '@scd/types';
import { emailsRepository } from './emails.repository.js';
import { logger } from '../../utils/logger.js';

/**
 * Service boundary only in this phase — no live email provider is wired
 * up. `enqueue` records the intent to send (status PENDING) so the data
 * model and call sites already exist; the actual provider integration
 * (integrations/email) lands in a later phase and will pick these up.
 */
export const emailsService = {
  async enqueue(
    userId: string | null,
    recipient: string,
    template: EmailTemplate,
    subject: string,
  ): Promise<void> {
    try {
      await emailsRepository.record(userId, recipient, template, subject);
    } catch (err) {
      logger.warn({ err, template, recipient }, 'Failed to record outgoing email intent');
    }
  },
};
