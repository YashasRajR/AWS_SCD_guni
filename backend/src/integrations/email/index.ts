import type { EmailTemplate } from '@scd/types';

/**
 * Email provider integration boundary. NOT implemented in this phase —
 * `EMAIL_PROVIDER_KEY` is read from env but unused; `modules/emails`
 * only records the intent to send (status PENDING). A real adapter
 * (Resend/SES/SendGrid/etc.) implements this interface in the email
 * delivery phase and flips PENDING → SENT/FAILED.
 */
export interface EmailProvider {
  send(input: {
    to: string;
    template: EmailTemplate;
    subject: string;
    data: Record<string, unknown>;
  }): Promise<{ providerMessageId: string }>;
}
