import type { EmailRecord, EmailTemplate } from '@scd/types';
import { emailsRepository } from './emails.repository.js';
import { toEmailRecord } from './emails.types.js';
import { logger } from '../../utils/logger.js';

/**
 * Records the intent to send an email (status PENDING) and returns
 * immediately — backend/src/jobs/email-worker.ts polls for due rows and
 * does the actual sending. Callers never wait on a live provider call, so
 * a slow/unreachable email provider can never stall or fail the request
 * that triggered the email (registration, password reset, etc.).
 *
 * `data` carries whatever the template needs to render (a verification
 * link, a ticket number, ...) — capture everything the caller already has
 * in hand here, since the worker has no way to re-derive it later.
 */
export const emailsService = {
  async enqueue(
    userId: string | null,
    recipient: string,
    template: EmailTemplate,
    subject: string,
    data: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await emailsRepository.record(userId, recipient, template, subject, data);
    } catch (err) {
      logger.warn({ err, template, recipient }, 'Failed to record outgoing email intent');
    }
  },

  async listForUser(userId: string, templates: EmailTemplate[]): Promise<EmailRecord[]> {
    const rows = await emailsRepository.listForUser(userId, templates);
    return rows.map(toEmailRecord);
  },
};
