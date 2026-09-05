import { randomUUID } from 'node:crypto';
import type { EmailTemplate } from '@scd/types';
import { logger } from '../../utils/logger.js';
import { renderEmailTemplate } from './templates.js';
import type { EmailAttachment, EmailProvider } from './index.js';

/**
 * Current default (and, until a real transport lands, only) provider. It
 * never silently pretends nothing happened: it logs the fully rendered
 * email — including any verification/reset link, so local dev and manual
 * testing can still complete those flows by reading the log — clearly
 * labeled as not actually sent, then reports success so the email_records
 * row is marked SENT instead of retrying forever against nothing.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(input: {
    to: string;
    template: EmailTemplate;
    subject: string;
    data: Record<string, unknown>;
    attachments?: EmailAttachment[];
  }): Promise<{ providerMessageId: string }> {
    const { text } = renderEmailTemplate(input.template, input.data);
    logger.warn(
      {
        to: input.to,
        template: input.template,
        subject: input.subject,
        body: text,
        attachments: input.attachments?.map((a) => a.filename),
      },
      '[EMAIL NOT SENT — no real provider configured] This is a simulated delivery; the content above (including any link) was never emailed to the recipient.',
    );
    return { providerMessageId: `console-simulated-${randomUUID()}` };
  }
}
