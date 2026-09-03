import type { EmailTemplate } from '@scd/types';
import { logger } from '../../utils/logger.js';
import { ConsoleEmailProvider } from './console-provider.js';

/**
 * Email provider integration boundary — deliberately provider-agnostic so
 * a real transport (SMTP, SES, Resend, ...) can be added later without
 * touching call sites. Only ConsoleEmailProvider is implemented right
 * now: real emails aren't wired up yet on purpose, so verify/reset/ticket
 * links are logged (never discarded) instead of actually delivered.
 */
export interface EmailProvider {
  send(input: {
    to: string;
    template: EmailTemplate;
    subject: string;
    data: Record<string, unknown>;
  }): Promise<{ providerMessageId: string }>;
}

let cachedProvider: EmailProvider | undefined;

/**
 * Always returns the console provider today. Cached for the process
 * lifetime like getPool()/getEnv()/getPaymentProvider(). When a real
 * transport is ready, this is the one place that changes — it should pick
 * it based on env config the same way getPaymentProvider() does.
 */
export function getEmailProvider(): EmailProvider {
  if (!cachedProvider) {
    logger.warn(
      'No real email provider is configured — emails are logged to the console, not sent. This must change before go-live.',
    );
    cachedProvider = new ConsoleEmailProvider();
  }
  return cachedProvider;
}
