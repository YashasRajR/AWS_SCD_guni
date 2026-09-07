import type { Ticket } from '@scd/types';
import { ticketsRepository } from './tickets.repository.js';
import { toTicket, type TicketRow } from './tickets.types.js';
import { qrTokensService } from '../qr-tokens/qr-tokens.service.js';
import { buildTicketPdf } from './ticket-pdf.js';
import { registrationsRepository } from '../registrations/registrations.repository.js';
import type { RegistrationRow } from '../registrations/registrations.types.js';
import { attendeesRepository } from '../attendees/attendees.repository.js';
import type { EventConfig } from '@scd/types';
import { eventService } from '../event/event.service.js';
import { emailsService } from '../emails/emails.service.js';
import { usersService } from '../users/users.service.js';
import { documentsRepository } from '../documents/documents.repository.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

/** Ticket-plan price minus any coupon discount, falling back to the
 * event's flat registration fee for pre-ticket-plan-era registrations
 * (same computation as the dashboard's own requiresPayment display). */
export function formatAmountPaid(registration: RegistrationRow, event: EventConfig): string {
  const price = registration.tp_price != null ? Number(registration.tp_price) : Number(event.registrationFee);
  const currency = registration.tp_currency ?? event.currency;
  const final = Math.max(price - Number(registration.discount_amount || '0'), 0);
  return final === 0 ? 'Free' : `${currency} ${final.toFixed(2)}`;
}

async function renderAndStorePdf(
  ticket: TicketRow,
  registrationToken: string,
  goodieToken: string,
): Promise<void> {
  const registration = await registrationsRepository.findById(ticket.registration_id);
  if (!registration) return;
  const [attendee, event] = await Promise.all([
    attendeesRepository.findById(registration.attendee_id),
    eventService.getCurrent(),
  ]);
  if (!attendee) return;

  const pdf = await buildTicketPdf({
    ticketNumber: ticket.ticket_number,
    registrationNumber: registration.registration_number,
    issuedAt: ticket.issued_at,
    attendeeName: attendee.full_name,
    university: attendee.university,
    department: attendee.department,
    year: attendee.year,
    phone: attendee.phone,
    ticketPlanName: registration.tp_name,
    amountLabel: formatAmountPaid(registration, event),
    eventName: event.name,
    eventDate: event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    venue: event.venue,
    registrationToken,
    goodieToken,
  });
  await ticketsRepository.setPdfData(ticket.id, pdf);
}

export const ticketsService = {
  async getByRegistrationId(registrationId: string): Promise<Ticket | null> {
    const row = await ticketsRepository.findByRegistrationId(registrationId);
    return row ? toTicket(row) : null;
  },

  async getPdfBuffer(ticketId: string): Promise<Buffer> {
    const pdf = await ticketsRepository.findPdfData(ticketId);
    if (!pdf) throw AppError.notFound('Ticket PDF', 'This ticket has no generated PDF yet.');
    return pdf;
  },

  /**
   * Admin action: rotates both QR tokens and regenerates the PDF from
   * scratch (spec #62). The PDF being replaced is archived to
   * document_versions first, under its current version number, so a
   * lost/superseded ticket can still be looked up later; the QR rotation
   * this already did (qrTokensService.rotateBoth) is what makes the old
   * version unscannable.
   */
  async reissuePdf(ticketId: string, reason: string, adminUserId: string | null): Promise<void> {
    const ticket = await ticketsRepository.findById(ticketId);
    if (!ticket) throw AppError.notFound('Ticket');
    const oldPdf = await ticketsRepository.findPdfData(ticketId);
    if (oldPdf) {
      await documentsRepository.archiveVersion('TICKET', ticketId, ticket.version, oldPdf, reason, adminUserId);
    }
    const { registrationToken, goodieToken } = await qrTokensService.rotateBoth(ticketId);
    await renderAndStorePdf(ticket, registrationToken, goodieToken);
    await ticketsRepository.bumpVersion(ticketId);
  },

  /** Version history for a ticket's PDF (spec #62 admin "History" view). */
  async listVersions(ticketId: string) {
    const rows = await documentsRepository.listVersions('TICKET', ticketId);
    return rows.map((row) => ({ id: row.id, version: row.version, reason: row.reason, createdAt: row.created_at }));
  },

  async getVersionPdfBuffer(ticketId: string, version: number): Promise<Buffer> {
    const pdf = await documentsRepository.getVersionPdf('TICKET', ticketId, version);
    if (!pdf) throw AppError.notFound('Ticket PDF version');
    return pdf;
  },

  /** Admin action: re-emails the (already-generated) ticket PDF to the attendee's own address. */
  async resendEmail(ticketId: string): Promise<void> {
    const ticket = await ticketsRepository.findById(ticketId);
    if (!ticket) throw AppError.notFound('Ticket');
    const registration = await registrationsRepository.findById(ticket.registration_id);
    if (!registration) throw AppError.notFound('Registration');
    const attendee = await attendeesRepository.findById(registration.attendee_id);
    if (!attendee) throw AppError.notFound('Attendee');
    const user = await usersService.getPublicUserById(attendee.user_id);
    if (!user) throw AppError.notFound('User');
    const event = await eventService.getCurrent();

    await emailsService.enqueue(
      user.id,
      user.email,
      'ticket-resend',
      'Your AWS Student Community Day ticket',
      {
        fullName: attendee.full_name,
        registrationNumber: registration.registration_number,
        ticketNumber: ticket.ticket_number,
        ticketId: ticket.id,
        ticketPlanName: registration.tp_name,
        amountLabel: formatAmountPaid(registration, event),
        phone: attendee.phone,
        issuedAt: ticket.issued_at,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        supportEmail: event.contactEmail,
      },
    );
  },

  /**
   * Issues a ticket the first time a registration is confirmed; a second
   * call for the same registration returns the already-issued ticket
   * rather than erroring (registrations can be re-confirmed idempotently).
   */
  async issueIfNeeded(registrationId: string): Promise<Ticket> {
    const existing = await ticketsRepository.findByRegistrationId(registrationId);
    const row = existing ?? (await ticketsRepository.issue(registrationId));

    // issueForTicket is idempotent per type — a re-confirm that hits the
    // `existing` branch above still backfills QR tokens if an earlier call
    // never got that far, and is a no-op once both types exist.
    const issued = await qrTokensService.issueForTicket(row.id);

    // Only a fully-fresh issuance yields both raw tokens at once, which is
    // what building the PDF needs — a partial backfill (one type already
    // existed) can't produce a complete PDF here; use reissuePdf for that.
    if (!row.pdf_data && issued.length === 2) {
      const registrationToken = issued.find((t) => t.type === 'REGISTRATION')!.rawToken;
      const goodieToken = issued.find((t) => t.type === 'GOODIE')!.rawToken;
      await renderAndStorePdf(row, registrationToken, goodieToken).catch((err) => {
        logger.warn({ err, ticketId: row.id }, 'Ticket PDF generation failed');
      });
    }

    return toTicket(row);
  },
};
