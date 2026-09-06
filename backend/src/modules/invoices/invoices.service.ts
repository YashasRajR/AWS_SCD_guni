import type { Invoice, PaginatedData } from '@scd/types';
import { generateReferenceCode } from '@scd/utils';
import { invoicesRepository } from './invoices.repository.js';
import { toInvoice } from './invoices.types.js';
import { buildInvoicePdf } from './invoice-pdf.js';
import type { PaymentRow } from '../payments/payments.types.js';
import { registrationsRepository } from '../registrations/registrations.repository.js';
import { attendeesRepository } from '../attendees/attendees.repository.js';
import { eventService } from '../event/event.service.js';
import { toRegistration } from '../registrations/registrations.types.js';
import { emailsService } from '../emails/emails.service.js';
import { usersService } from '../users/users.service.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export const invoicesService = {
  async getByRegistrationId(registrationId: string): Promise<Invoice | null> {
    const row = await invoicesRepository.findByRegistrationId(registrationId);
    return row ? toInvoice(row) : null;
  },

  async getPdfBuffer(invoiceId: string): Promise<Buffer> {
    const pdf = await invoicesRepository.findPdfData(invoiceId);
    if (!pdf) throw AppError.notFound('Invoice PDF', 'This invoice has no generated PDF yet.');
    return pdf;
  },

  async findById(id: string): Promise<Invoice | null> {
    const row = await invoicesRepository.findById(id);
    return row ? toInvoice(row) : null;
  },

  async list(page: number, pageSize: number, search?: string): Promise<PaginatedData<Invoice>> {
    const { rows, total } = await invoicesRepository.list(page, pageSize, search);
    return {
      items: rows.map(toInvoice),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  /**
   * Issued once a payment is confirmed (see payments.service.ts's
   * payment.captured handler) -- idempotent per payment, same as
   * ticketsService.issueIfNeeded is per registration. Best-effort by
   * design: a failure here must never undo or block the payment
   * confirmation that triggered it (spec: "PDF generation fails: retry
   * without creating duplicate registration/payment"), so the caller
   * wraps this in a try/catch and only logs.
   */
  async issueForPayment(payment: PaymentRow): Promise<Invoice> {
    const existing = await invoicesRepository.findByPaymentId(payment.id);
    if (existing) return toInvoice(existing);

    const registrationRow = await registrationsRepository.findById(payment.registration_id);
    if (!registrationRow) throw AppError.notFound('Registration');
    const registration = toRegistration(registrationRow);
    const attendee = await attendeesRepository.findById(registration.attendeeId);
    if (!attendee) throw AppError.notFound('Attendee');
    const event = await eventService.getCurrent();

    const invoiceNumber = generateReferenceCode('INV');
    const pdf = await buildInvoicePdf({
      invoiceNumber,
      registrationNumber: registration.registrationNumber,
      attendeeName: attendee.full_name,
      university: attendee.university,
      eventName: event.name,
      ticketPlanName: registration.ticketPlan?.name ?? null,
      amount: payment.amount,
      discountAmount: registration.discountAmount,
      taxAmount: '0',
      currency: payment.currency,
      couponCode: registration.coupon?.code ?? null,
      paymentReference: payment.provider_payment_id,
      paidAt: payment.paid_at,
    });

    const row = await invoicesRepository.create({
      paymentId: payment.id,
      registrationId: registration.id,
      invoiceNumber,
      amount: payment.amount,
      discountAmount: registration.discountAmount,
      currency: payment.currency,
      pdf,
    });

    logger.info({ invoiceId: row.id, paymentId: payment.id }, 'Invoice issued');
    return toInvoice(row);
  },

  /** Admin action: re-emails the (already-generated) invoice PDF to the attendee's own address. */
  async resendEmail(invoiceId: string): Promise<void> {
    const invoiceRow = await invoicesRepository.findById(invoiceId);
    if (!invoiceRow) throw AppError.notFound('Invoice');
    const registrationRow = await registrationsRepository.findById(invoiceRow.registration_id);
    if (!registrationRow) throw AppError.notFound('Registration');
    const registration = toRegistration(registrationRow);
    const attendee = await attendeesRepository.findById(registration.attendeeId);
    if (!attendee) throw AppError.notFound('Attendee');
    const user = await usersService.getPublicUserById(attendee.user_id);
    if (!user) throw AppError.notFound('User');

    await emailsService.enqueue(
      user.id,
      user.email,
      'invoice-resend',
      'Your AWS Student Community Day fee receipt',
      {
        fullName: attendee.full_name,
        invoiceNumber: invoiceRow.invoice_number,
        invoiceId: invoiceRow.id,
      },
    );
  },
};
