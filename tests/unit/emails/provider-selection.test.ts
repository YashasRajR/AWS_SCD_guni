import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const originalSmtpHost = process.env.EMAIL_SMTP_HOST;

describe('getEmailProvider', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalSmtpHost === undefined) delete process.env.EMAIL_SMTP_HOST;
    else process.env.EMAIL_SMTP_HOST = originalSmtpHost;
  });

  it('falls back to the console provider when EMAIL_SMTP_HOST is unset', async () => {
    delete process.env.EMAIL_SMTP_HOST;
    const { getEmailProvider } = await import('../../../backend/src/integrations/email/index.js');
    const { ConsoleEmailProvider } = await import(
      '../../../backend/src/integrations/email/console-provider.js'
    );

    const provider = getEmailProvider();

    expect(provider).toBeInstanceOf(ConsoleEmailProvider);
  });

  it('picks the SMTP provider once EMAIL_SMTP_HOST is configured', async () => {
    process.env.EMAIL_SMTP_HOST = 'smtp.example.test';
    const { getEmailProvider } = await import('../../../backend/src/integrations/email/index.js');
    const { SmtpEmailProvider } = await import('../../../backend/src/integrations/email/smtp-provider.js');

    const provider = getEmailProvider();

    expect(provider).toBeInstanceOf(SmtpEmailProvider);
  });

  it('caches the provider across calls within the same process', async () => {
    delete process.env.EMAIL_SMTP_HOST;
    const { getEmailProvider } = await import('../../../backend/src/integrations/email/index.js');

    const first = getEmailProvider();
    const second = getEmailProvider();

    expect(first).toBe(second);
  });
});
