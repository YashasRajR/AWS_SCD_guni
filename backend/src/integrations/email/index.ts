import type { EmailTemplate } from '@scd/types';
import { getEnv } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ConsoleEmailProvider } from './console-provider.js';
import { SmtpEmailProvider } from './smtp-provider.js';

/**
 * Email provider integration boundary — deliberately provider-agnostic so
 * a real transport (SMTP, SES, Resend, ...) can be added later without
 * touching call sites. Picks SmtpEmailProvider once EMAIL_SMTP_HOST is
 * configured (see env.ts / .env.example); otherwise falls back to
 * ConsoleEmailProvider so verify/reset/ticket links are still logged
 * (never silently discarded) during local development.
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

export function getEmailProvider(): EmailProvider {
  if (!cachedProvider) {
    const env = getEnv();
    if (env.EMAIL_SMTP_HOST) {
      logger.info({ host: env.EMAIL_SMTP_HOST }, 'Using SMTP email provider');
      cachedProvider = new SmtpEmailProvider();
    } else {
      logger.warn(
        'No EMAIL_SMTP_HOST configured — emails are logged to the console, not sent. Set EMAIL_SMTP_* to enable real delivery before go-live.',
      );
      cachedProvider = new ConsoleEmailProvider();
    }
  }
  return cachedProvider;
}

/** Test-only: clears the cached provider so a test can reconfigure env and re-resolve. */
export function resetEmailProviderCache(): void {
  cachedProvider = undefined;
}
