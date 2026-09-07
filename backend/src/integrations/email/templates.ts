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
/**
 * Ticket confirmation email -- a bespoke layout (masthead, hero, ticket
 * stub, essentials, checkpoints, support, footer) rather than the shared
 * `wrap()` envelope every other template uses, matching the brand's own
 * purple/orange palette (apps/web/src/styles/tokens.css) instead of the
 * generic navy/orange `wrap()` header. Used for both 'ticket' (first
 * issuance) and 'ticket-resend' (admin/self resend) -- the only
 * difference is the hero headline.
 */
function renderTicketEmail(data: Record<string, unknown>, isResend: boolean): RenderedEmail {
  const env = getEnv();
  const str = (key: string, fallback = ''): string =>
    typeof data[key] === 'string' ? (data[key] as string) : fallback;

  const name = str('fullName', 'there');
  const firstName = name.split(' ')[0] || name;
  const ticketNumber = str('ticketNumber');
  const registrationNumber = str('registrationNumber');
  const ticketPlanName = str('ticketPlanName', 'General admission');
  const amountLabel = str('amountLabel', '—');
  const phone = str('phone', '—');
  const supportEmail = str('supportEmail', env.EMAIL_FROM_ADDRESS);
  const dashboardUrl = `${env.PUBLIC_APP_URL.replace(/\/$/, '')}/dashboard`;

  const issuedAtRaw = str('issuedAt');
  const issuedOn = issuedAtRaw
    ? new Date(issuedAtRaw).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '—';

  const eventDateRaw = str('eventDate');
  const eventDate = eventDateRaw
    ? new Date(eventDateRaw).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'To be announced';
  const startTime = str('startTime');
  const endTime = str('endTime');
  const eventTime = startTime ? `${startTime}${endTime ? ` – ${endTime}` : ''} IST` : 'To be announced';
  const venue = str('venue', 'To be announced');

  const heroTitle = isResend ? `Here&rsquo;s your ticket, ${escapeHtml(firstName)}.` : `You&rsquo;re in, ${escapeHtml(firstName)}.`;
  const heroBody = isResend
    ? "You asked for a fresh copy of your AWS Student Community Day 2026 ticket. It's attached to this email."
    : "Your seat at AWS Student Community Day 2026 is secured and your ticket has been issued. The pass PDF is attached to this email — keep it handy, it's what gets you through the Registration checkpoint.";

  const checkpoints = ['Registration', 'Breakfast', 'Lunch', 'High Tea', 'Goodies'];
  const checkpointChips = checkpoints
    .map(
      (c) =>
        `<td style="padding:0 6px 6px 0;"><span style="display:inline-block; border:1px solid rgba(255,255,255,0.35); color:#ffffff; font-family:Arial, Helvetica, sans-serif; font-size:11px; line-height:14px; letter-spacing:1.2px; text-transform:uppercase; padding:7px 11px;">${escapeHtml(c)}</span></td>`,
    )
    .join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>Your ticket — AWS Student Community Day 2026</title>
<style>a{color:#50377a;} a:hover{color:#3f2b61;} @media only screen and (max-width:600px){.stack{display:block!important;width:100%!important;}.pad-x{padding-left:22px!important;padding-right:22px!important;}}</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#f8f6fc;color:#14181f;font-family:Arial,Helvetica,sans-serif;">
<span style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:#f8f6fc;">Ticket ${escapeHtml(ticketNumber)} — your PDF pass is attached.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f6fc;">
<tr><td align="center" style="padding:28px 12px 40px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid rgba(51,32,82,0.18);">
  <tr><td style="background-color:#332052;padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="pad-x" style="padding:22px 0 22px 32px;vertical-align:middle;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:18px;letter-spacing:0.5px;color:#ffffff;text-transform:uppercase;">AWS Student Community Day</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:18px;letter-spacing:0.5px;color:#f28a45;text-transform:uppercase;">2026 &nbsp;/&nbsp; Ganpat University</div>
      </td>
      <td class="pad-x" align="right" style="padding:22px 32px 22px 0;vertical-align:middle;">
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2.4px;color:#c9bcdf;text-transform:uppercase;">Official&nbsp;Ticket</span>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="height:4px;background-color:#f28a45;font-size:0;line-height:0;">&nbsp;</td></tr>

  <tr><td class="pad-x" style="padding:40px 32px 30px 32px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2.4px;color:#50377a;text-transform:uppercase;font-weight:bold;">${isResend ? 'Ticket resend' : 'Registration confirmed'}</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:34px;line-height:38px;letter-spacing:-0.5px;color:#332052;font-weight:bold;padding-top:10px;">${heroTitle}</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#3d4451;padding-top:14px;">${heroBody}</div>
  </td></tr>

  <tr><td class="pad-x" style="padding:0 32px 8px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #332052;background-color:#ffffff;">
      <tr>
        <td class="stub-side" width="172" style="width:172px;background-color:#50377a;padding:24px 20px;vertical-align:top;border-right:1px dashed #ffffff;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2.2px;color:#d6c9ea;text-transform:uppercase;">Ticket no.</div>
          <div style="font-family:'Courier New',Courier,monospace;font-size:18px;line-height:22px;font-weight:bold;color:#ffffff;padding-top:6px;">${escapeHtml(ticketNumber)}</div>
          <div style="height:1px;background-color:rgba(255,255,255,0.28);font-size:0;line-height:0;margin:16px 0;">&nbsp;</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2.2px;color:#d6c9ea;text-transform:uppercase;">Registration</div>
          <div style="font-family:'Courier New',Courier,monospace;font-size:14px;line-height:20px;color:#ffffff;padding-top:4px;">${escapeHtml(registrationNumber)}</div>
          <div style="padding-top:16px;"><span style="display:inline-block;background-color:#f28a45;color:#241934;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;padding:6px 10px;">Issued</span></div>
        </td>
        <td class="stub-side" style="padding:24px 24px 20px 24px;vertical-align:top;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2.2px;color:#656d79;text-transform:uppercase;">Attendee</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:24px;letter-spacing:-0.4px;color:#332052;font-weight:bold;padding-top:5px;">${escapeHtml(name)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding-top:16px;">
            <tr>
              <td class="cell-half" width="50%" style="width:50%;padding:12px 10px 0 0;vertical-align:top;border-top:1px solid rgba(51,32,82,0.18);">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2.2px;color:#656d79;text-transform:uppercase;">Ticket type</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#14181f;padding-top:3px;">${escapeHtml(ticketPlanName)}</div>
              </td>
              <td class="cell-half" width="50%" style="width:50%;padding:12px 0 0 10px;vertical-align:top;border-top:1px solid rgba(51,32,82,0.18);">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2.2px;color:#656d79;text-transform:uppercase;">Amount paid</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#1c7a41;padding-top:3px;">${escapeHtml(amountLabel)}</div>
              </td>
            </tr>
            <tr>
              <td class="cell-half" width="50%" style="width:50%;padding:12px 10px 0 0;vertical-align:top;border-top:1px solid rgba(51,32,82,0.18);">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2.2px;color:#656d79;text-transform:uppercase;">Phone</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#14181f;padding-top:3px;">${escapeHtml(phone)}</div>
              </td>
              <td class="cell-half" width="50%" style="width:50%;padding:12px 0 0 10px;vertical-align:top;border-top:1px solid rgba(51,32,82,0.18);">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2.2px;color:#656d79;text-transform:uppercase;">Issued on</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#14181f;padding-top:3px;">${escapeHtml(issuedOn)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#656d79;padding-top:10px;">This ticket is non-transferable and valid for one attendee. Details are verified by name and registration number at each checkpoint.</div>
  </td></tr>

  <tr><td class="pad-x" style="padding:26px 32px 8px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef1f5;border-left:4px solid #50377a;">
      <tr><td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#3d4451;"><strong style="color:#332052;">Attached:</strong> AWS-SCD-2026-${escapeHtml(ticketNumber)}.pdf &nbsp;&middot;&nbsp; your fee receipt too, if this registration required payment</td></tr>
    </table>
  </td></tr>
  <tr><td class="pad-x" style="padding:20px 32px 0 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td bgcolor="#50377a" style="background-color:#50377a;border-radius:4px;" align="center">
        <a href="${escapeHtml(dashboardUrl)}" style="display:block;padding:16px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;letter-spacing:0.6px;color:#ffffff;text-decoration:none;">View in dashboard</a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td class="pad-x" style="padding:34px 32px 0 32px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2.4px;color:#50377a;text-transform:uppercase;font-weight:bold;">The essentials</div>
    <div style="height:2px;background-color:#332052;width:36px;font-size:0;line-height:0;margin-top:10px;">&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding-top:16px;">
      <tr><td width="120" style="width:120px;padding:12px 12px 12px 0;vertical-align:top;border-bottom:1px solid rgba(51,32,82,0.18);font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.6px;color:#656d79;text-transform:uppercase;">Date</td>
          <td style="padding:12px 0;vertical-align:top;border-bottom:1px solid rgba(51,32,82,0.18);font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#14181f;"><strong>${escapeHtml(eventDate)}</strong></td></tr>
      <tr><td width="120" style="width:120px;padding:12px 12px 12px 0;vertical-align:top;border-bottom:1px solid rgba(51,32,82,0.18);font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.6px;color:#656d79;text-transform:uppercase;">Time</td>
          <td style="padding:12px 0;vertical-align:top;border-bottom:1px solid rgba(51,32,82,0.18);font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#14181f;">${escapeHtml(eventTime)}</td></tr>
      <tr><td width="120" style="width:120px;padding:12px 12px 12px 0;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.6px;color:#656d79;text-transform:uppercase;">Venue</td>
          <td style="padding:12px 0;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#14181f;">${escapeHtml(venue)}</td></tr>
    </table>
  </td></tr>

  <tr><td class="pad-x" style="padding:30px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#332052;"><tr><td style="padding:22px 24px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2.4px;color:#f28a45;text-transform:uppercase;font-weight:bold;">Included with your pass</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#e8e2f2;padding-top:10px;">Checkpoints covered by this ticket. A volunteer or your QR code marks each one off.</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding-top:16px;"><tr>${checkpointChips}</tr></table>
    </td></tr></table>
  </td></tr>

  <tr><td class="pad-x" style="padding:30px 32px 36px 32px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#3d4451;">Something wrong on your ticket &mdash; wrong name, wrong plan, PDF won&rsquo;t open? Reply to this email or write to <a href="mailto:${escapeHtml(supportEmail)}" style="color:#50377a;font-weight:bold;text-decoration:underline;">${escapeHtml(supportEmail)}</a> with your registration number and we&rsquo;ll fix it before the day.</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#332052;padding-top:20px;">See you at Ganpat.<br><strong>&mdash; The AWS Student Community Day 2026 team</strong></div>
  </td></tr>

  <tr><td style="background-color:#eef1f5;padding:24px 32px;border-top:1px solid rgba(51,32,82,0.18);">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#565d68;"><strong style="color:#332052;">AWS Student Community Day 2026</strong><br>Ganpat University, Mehsana, Gujarat, India</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#656d79;padding-top:12px;">You&rsquo;re receiving this because you registered for this event. Ticket and receipt emails are transactional and always sent.</div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = `AWS Student Community Day 2026 -- Official Ticket

${isResend ? "Here's your ticket" : "You're in"}, ${firstName}.
${heroBody.replace(/<[^>]+>/g, '')}

Ticket no.: ${ticketNumber}
Registration: ${registrationNumber}
Attendee: ${name}
Ticket type: ${ticketPlanName}
Amount paid: ${amountLabel}
Phone: ${phone}
Issued on: ${issuedOn}

Attached: AWS-SCD-2026-${ticketNumber}.pdf (plus your fee receipt, if this registration required payment).
View in dashboard: ${dashboardUrl}

THE ESSENTIALS
Date: ${eventDate}
Time: ${eventTime}
Venue: ${venue}

Included with your pass: ${checkpoints.join(', ')}.

Something wrong on your ticket? Reply to this email or write to ${supportEmail} with your registration number.

See you at Ganpat.
-- The AWS Student Community Day 2026 team`;

  return { html, text };
}

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
    case 'waitlisted': {
      const name = str('fullName', 'there');
      const number = str('registrationNumber');
      return wrap(
        `<p>Hi ${escapeHtml(name)},</p><p>You've been added to the waitlist for AWS Student Community Day 2026.</p><p><strong>Registration number:</strong> ${escapeHtml(number)}</p><p>We'll email you the moment a spot opens up — no action needed from you right now.</p>`,
        `Hi ${name},\n\nYou've been added to the waitlist for AWS Student Community Day 2026.\nRegistration number: ${number}\n\nWe'll email you the moment a spot opens up -- no action needed from you right now.`,
      );
    }
    case 'registration-rejected': {
      const name = str('fullName', 'there');
      const number = str('registrationNumber');
      return wrap(
        `<p>Hi ${escapeHtml(name)},</p><p>We're sorry to let you know your registration for AWS Student Community Day 2026 wasn't accepted.</p><p><strong>Registration number:</strong> ${escapeHtml(number)}</p><p>If you think this is a mistake, reply to this email and we'll take another look.</p>`,
        `Hi ${name},\n\nWe're sorry to let you know your registration for AWS Student Community Day 2026 wasn't accepted.\nRegistration number: ${number}\n\nIf you think this is a mistake, reply to this email and we'll take another look.`,
      );
    }
    case 'ticket':
    case 'ticket-resend':
      return renderTicketEmail(data, template === 'ticket-resend');

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
