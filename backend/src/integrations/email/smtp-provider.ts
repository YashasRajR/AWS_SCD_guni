import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailTemplate } from '@scd/types';
import { getEnv } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { renderEmailTemplate } from './templates.js';
import type { EmailProvider } from './index.js';

/**
 * Real delivery via SMTP — deliberately provider-agnostic at the
 * transport level (works with a Gmail app password, a free-tier relay
 * like Brevo/Mailtrap, or a self-hosted mail server; anything that speaks
 * SMTP). Picked automatically by getEmailProvider() once EMAIL_SMTP_HOST
 * is set — see env.ts and .env.example for the full variable list. Never
 * silently swallows a send failure: nodemailer throws on a rejected send,
 * which propagates up to the email worker's existing retry/backoff logic
 * (jobs/email-worker.ts) exactly the same as any other provider error.
 */
export class SmtpEmailProvider implements EmailProvider {
  private transporter: Transporter | undefined;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const env = getEnv();
      this.transporter = nodemailer.createTransport({
        host: env.EMAIL_SMTP_HOST,
        port: env.EMAIL_SMTP_PORT,
        secure: env.EMAIL_SMTP_SECURE,
        auth: env.EMAIL_SMTP_USER ? { user: env.EMAIL_SMTP_USER, pass: env.EMAIL_SMTP_PASSWORD } : undefined,
      });
    }
    return this.transporter;
  }

  async send(input: {
    to: string;
    template: EmailTemplate;
    subject: string;
    data: Record<string, unknown>;
  }): Promise<{ providerMessageId: string }> {
    const env = getEnv();
    const { html, text } = renderEmailTemplate(input.template, input.data);

    const info = await this.getTransporter().sendMail({
      from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`,
      to: input.to,
      subject: input.subject,
      html,
      text,
    });

    logger.info(
      { to: input.to, template: input.template, providerMessageId: info.messageId },
      'Email sent via SMTP',
    );
    return { providerMessageId: info.messageId };
  }
}
