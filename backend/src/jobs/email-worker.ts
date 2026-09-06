import { emailsRepository } from '../modules/emails/emails.repository.js';
import { getEmailProvider, type EmailAttachment } from '../integrations/email/index.js';
import { ticketsService } from '../modules/tickets/tickets.service.js';
import { invoicesService } from '../modules/invoices/invoices.service.js';
import { logger } from '../utils/logger.js';

const POLL_INTERVAL_MS = 10_000;
const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 5;

/** attempt 1 -> 30s, 2 -> 1m, 3 -> 2m, 4 -> 4m, ... capped at 30m. */
function backoffMs(attempts: number): number {
  return Math.min(30_000 * 2 ** (attempts - 1), 30 * 60_000);
}

/**
 * A 'ticket'/'ticket-resend' record carries the ticketId (and, for the
 * invoice add-on, the registrationId) it was enqueued for — see
 * registrations.service.ts notifyConfirmed. An 'invoice-resend' record
 * carries the invoiceId directly. Both fetch the already-generated PDF(s)
 * at send time rather than enqueue time, so the attachment is always
 * whatever's currently stored (e.g. after an admin reissue), not a stale
 * copy. A missing/not-yet-generated PDF logs a warning and is skipped
 * rather than blocking delivery of the rest of the email or retrying
 * forever over a PDF that may never exist for this record.
 */
async function loadAttachments(
  template: string,
  data: Record<string, unknown>,
): Promise<EmailAttachment[] | undefined> {
  if (template === 'invoice-resend') {
    const invoiceId = typeof data.invoiceId === 'string' ? data.invoiceId : null;
    const invoiceNumber = typeof data.invoiceNumber === 'string' ? data.invoiceNumber : 'invoice';
    if (!invoiceId) return undefined;
    try {
      const pdf = await invoicesService.getPdfBuffer(invoiceId);
      return [{ filename: `AWS-SCD-2026-${invoiceNumber}.pdf`, content: pdf }];
    } catch (err) {
      logger.warn({ err, invoiceId }, 'Invoice PDF not available for email attachment — sending without it');
      return undefined;
    }
  }

  if (template !== 'ticket' && template !== 'ticket-resend') return undefined;
  const attachments: EmailAttachment[] = [];

  const ticketId = typeof data.ticketId === 'string' ? data.ticketId : null;
  const ticketNumber = typeof data.ticketNumber === 'string' ? data.ticketNumber : 'ticket';
  if (ticketId) {
    try {
      const pdf = await ticketsService.getPdfBuffer(ticketId);
      attachments.push({ filename: `AWS-SCD-2026-${ticketNumber}.pdf`, content: pdf });
    } catch (err) {
      logger.warn(
        { err, ticketId },
        'Ticket PDF not available for email attachment — sending without it',
      );
    }
  }

  const registrationId = typeof data.registrationId === 'string' ? data.registrationId : null;
  if (registrationId) {
    try {
      const invoice = await invoicesService.getByRegistrationId(registrationId);
      if (invoice?.pdfAvailable) {
        const pdf = await invoicesService.getPdfBuffer(invoice.id);
        attachments.push({ filename: `AWS-SCD-2026-${invoice.invoiceNumber}.pdf`, content: pdf });
      }
    } catch (err) {
      logger.warn(
        { err, registrationId },
        'Invoice PDF not available for email attachment — sending without it',
      );
    }
  }

  return attachments.length > 0 ? attachments : undefined;
}

/**
 * `email_records` itself is the outbox/queue — no Redis/BullMQ, per the
 * "prefer a clean modular monolith, no unnecessary infrastructure" rule.
 * This in-process interval poller picks up due rows, renders + sends
 * them, and records the outcome. Any single row failing to send is
 * caught and retried later; it never crashes the worker loop or the
 * process.
 */
async function processBatch(): Promise<void> {
  const due = await emailsRepository.listDue(BATCH_SIZE);
  for (const record of due) {
    try {
      const attachments = await loadAttachments(record.template, record.data);
      const { providerMessageId } = await getEmailProvider().send({
        to: record.recipient,
        template: record.template,
        subject: record.subject,
        data: record.data,
        attachments,
      });
      await emailsRepository.markSent(record.id, providerMessageId);
    } catch (err) {
      const attempts = record.attempts + 1;
      const reason = err instanceof Error ? err.message : String(err);
      logger.warn(
        { err, emailRecordId: record.id, template: record.template, attempts },
        'Email send attempt failed',
      );
      await emailsRepository.markFailedAttempt(
        record.id,
        reason,
        attempts,
        MAX_ATTEMPTS,
        new Date(Date.now() + backoffMs(attempts)),
      );
    }
  }
}

export function startEmailWorker(): NodeJS.Timeout {
  const timer = setInterval(() => {
    processBatch().catch((err) => {
      logger.error({ err }, 'Email worker batch failed unexpectedly');
    });
  }, POLL_INTERVAL_MS);
  timer.unref();
  logger.info(`Email worker started (polling every ${POLL_INTERVAL_MS / 1000}s)`);
  return timer;
}

export function stopEmailWorker(timer: NodeJS.Timeout): void {
  clearInterval(timer);
}
