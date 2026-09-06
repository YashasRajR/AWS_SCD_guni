import type { EmailTemplate } from '@scd/types';
import { getEnv } from '../../config/env.js';

export interface RenderedEmail {
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Minimal, table-based layout — transactional email clients strip most CSS,
 * so this stays inline-styled and simple rather than reusing the web app's
 * design-token system, which wouldn't render reliably in an inbox anyway. */
function wrap(bodyHtml: string, bodyText: string): RenderedEmail {
  const brand = getEnv().EMAIL_FROM_NAME;
  return {
    html: `<!doctype html><html><body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#16222f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="background:#16222f;padding:20px 32px;">
<span style="color:#ff9900;font-weight:800;font-size:18px;">${escapeHtml(brand)}</span>
</td></tr>
<tr><td style="padding:32px;font-size:15px;line-height:1.6;">
${bodyHtml}
</td></tr>
<tr><td style="padding:16px 32px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
This is an automated message from ${escapeHtml(brand)}. If you weren't expecting it, you can safely ignore it.
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    text: `${brand}\n\n${bodyText}\n\n---\nThis is an automated message from ${brand}. If you weren't expecting it, you can safely ignore it.`,
  };
}

function button(label: string, link: string): string {
  return `<p style="text-align:center;margin:24px 0;"><a href="${escapeHtml(link)}" style="background:#ff9900;color:#16222f;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;display:inline-block;">${escapeHtml(label)}</a></p>`;
}

/**
 * Renders a template + its captured `data` into a subject-agnostic email
 * body (the subject line itself is stored separately on the email_records
 * row). Every field pulled from `data` has a safe fallback so a template
 * never throws on an incomplete payload.
 */
export function renderEmailTemplate(
  template: EmailTemplate,
  data: Record<string, unknown>,
): RenderedEmail {
  const str = (key: string, fallback = ''): string =>
    typeof data[key] === 'string' ? (data[key] as string) : fallback;

  switch (template) {
    case 'email-verification': {
      const link = str('link');
      return wrap(
        `<p>Hi there,</p><p>Thanks for registering for AWS Student Community Day 2026. Confirm your email address to finish setting up your account.</p>${button('Verify email', link)}<p>Or paste this link into your browser:<br><span style="word-break:break-all;color:#1a56b0;">${escapeHtml(link)}</span></p><p>This link expires in ${escapeHtml(str('ttl', '24 hours'))}.</p>`,
        `Thanks for registering for AWS Student Community Day 2026. Verify your email:\n${link}\n\nThis link expires in ${str('ttl', '24 hours')}.`,
      );
    }
    case 'password-reset': {
      const link = str('link');
      return wrap(
        `<p>Hi there,</p><p>We received a request to reset your password.</p>${button('Reset password', link)}<p>Or paste this link into your browser:<br><span style="word-break:break-all;color:#1a56b0;">${escapeHtml(link)}</span></p><p>This link expires in ${escapeHtml(str('ttl', '1 hour'))}. If you didn't request this, you can ignore this email.</p>`,
        `We received a request to reset your password:\n${link}\n\nThis link expires in ${str('ttl', '1 hour')}. If you didn't request this, you can ignore this email.`,
      );
    }
    case 'registration-confirmation': {
      const name = str('fullName', 'there');
      const number = str('registrationNumber');
      return wrap(
        `<p>Hi ${escapeHtml(name)},</p><p>Your registration for AWS Student Community Day 2026 is confirmed.</p><p><strong>Registration number:</strong> ${escapeHtml(number)}</p><p>Your ticket will follow separately. See you there!</p>`,
        `Hi ${name},\n\nYour registration for AWS Student Community Day 2026 is confirmed.\nRegistration number: ${number}\n\nYour ticket will follow separately. See you there!`,
      );
    }
    case 'ticket':
    case 'ticket-resend': {
      const name = str('fullName', 'there');
      const ticketNumber = str('ticketNumber');
      const registrationNumber = str('registrationNumber');
      return wrap(
        `<p>Hi ${escapeHtml(name)},</p><p>Here's your ticket for AWS Student Community Day 2026 -- your fee receipt/invoice is attached too, if this registration required payment.</p><p><strong>Ticket number:</strong> ${escapeHtml(ticketNumber)}<br><strong>Registration number:</strong> ${escapeHtml(registrationNumber)}</p><p>You can also view your ticket and invoice any time in your dashboard.</p>`,
        `Hi ${name},\n\nHere's your ticket for AWS Student Community Day 2026 -- your fee receipt/invoice is attached too, if this registration required payment.\nTicket number: ${ticketNumber}\nRegistration number: ${registrationNumber}\n\nYou can also view your ticket and invoice any time in your dashboard.`,
      );
    }
    case 'invoice-resend': {
      const name = str('fullName', 'there');
      const invoiceNumber = str('invoiceNumber');
      const registrationNumber = str('registrationNumber');
      return wrap(
        `<p>Hi ${escapeHtml(name)},</p><p>Here's your fee receipt / invoice for AWS Student Community Day 2026.</p><p><strong>Invoice number:</strong> ${escapeHtml(invoiceNumber)}<br><strong>Registration number:</strong> ${escapeHtml(registrationNumber)}</p><p>You can also view it any time in your dashboard.</p>`,
        `Hi ${name},\n\nHere's your fee receipt / invoice for AWS Student Community Day 2026.\nInvoice number: ${invoiceNumber}\nRegistration number: ${registrationNumber}\n\nYou can also view it any time in your dashboard.`,
      );
    }
    case 'payment-success': {
      const name = str('fullName', 'there');
      return wrap(
        `<p>Hi ${escapeHtml(name)},</p><p>We've received your payment for AWS Student Community Day 2026. Your registration is now confirmed.</p>`,
        `Hi ${name},\n\nWe've received your payment for AWS Student Community Day 2026. Your registration is now confirmed.`,
      );
    }
    case 'payment-failed': {
      const name = str('fullName', 'there');
      return wrap(
        `<p>Hi ${escapeHtml(name)},</p><p>Your payment for AWS Student Community Day 2026 didn't go through. Please try again from your dashboard.</p>`,
        `Hi ${name},\n\nYour payment for AWS Student Community Day 2026 didn't go through. Please try again from your dashboard.`,
      );
    }
    case 'certificate-ready': {
      const name = str('fullName', 'there');
      const link = str('link');
      return wrap(
        `<p>Hi ${escapeHtml(name)},</p><p>Your certificate of participation for AWS Student Community Day 2026 is ready.</p>${link ? button('View certificate', link) : ''}`,
        `Hi ${name},\n\nYour certificate of participation for AWS Student Community Day 2026 is ready.${link ? `\n${link}` : ''}`,
      );
    }
    case 'event-wrapped': {
      const name = str('fullName', 'there');
      const link = str('link');
      return wrap(
        `<p>Hi ${escapeHtml(name)},</p><p>Your personalized AWS Student Community Day 2026 wrap-up is ready.</p>${link ? button('View your wrap-up', link) : ''}`,
        `Hi ${name},\n\nYour personalized AWS Student Community Day 2026 wrap-up is ready.${link ? `\n${link}` : ''}`,
      );
    }
    case 'event-announcement': {
      const title = str('title', 'Event announcement');
      const body = str('body');
      return wrap(
        `<p><strong>${escapeHtml(title)}</strong></p><p>${escapeHtml(body)}</p>`,
        `${title}\n\n${body}`,
      );
    }
    default: {
      // Exhaustiveness guard: TypeScript flags this if EMAIL_TEMPLATES ever
      // grows without a matching case being added above.
      const _exhaustive: never = template;
      return wrap(`<p>${escapeHtml(String(_exhaustive))}</p>`, String(_exhaustive));
    }
  }
}
