import { RegistrationRepository } from './registration.repository.js';
import { TicketsService } from '../tickets/tickets.service.js';
import { EmailService } from '../../integrations/email/email.service.js';
import { PaymentIntegrationService } from '../../integrations/payment/payment.service.js';

export interface RegisterAttendeeInput {
  fullName: string;
  email: string;
  phone: string;
  university: string;
  department: string;
  year: string;
  registrationType: string;
  eventId?: string;
  amount?: number;
}

export class RegistrationService {
  static generateRegistrationNumber(): string {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `SCD2026-REG-${num}`;
  }

  static async registerAttendee(input: RegisterAttendeeInput) {
    const registrationNumber = this.generateRegistrationNumber();
    const eventId = input.eventId || '00000000-0000-0000-0000-000000000001'; // Default Event ID fallback
    const amount = input.amount || 0;

    const { userId, attendeeId, registration } = await RegistrationRepository.createRegistrationWithAttendee({
      eventId,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      university: input.university,
      department: input.department,
      year: input.year,
      registrationType: input.registrationType,
      registrationNumber
    });

    if (amount === 0) {
      // Auto-confirm zero-amount registrations
      const { registration: confirmedReg } = await PaymentIntegrationService.verifyAndConfirm(
        (await PaymentIntegrationService.createOrder({ registrationId: registration.id, amount: 0 })).paymentId,
        'FREE_GRANT'
      );

      // Issue Ticket
      const ticket = await TicketsService.issueTicketForRegistration(confirmedReg.id);

      // Send Confirmation + Ticket Email
      await EmailService.sendEmail({
        userId,
        recipient: input.email,
        template: 'ticket-delivery',
        subject: `Your AWS Student Community Day 2026 Ticket (${ticket.ticket_number})`,
        data: {
          fullName: input.fullName,
          registrationNumber: confirmedReg.registration_number,
          ticketNumber: ticket.ticket_number,
          university: input.university
        }
      });

      return {
        status: 'CONFIRMED',
        registrationId: confirmedReg.id,
        registrationNumber: confirmedReg.registration_number,
        ticketNumber: ticket.ticket_number,
        paymentRequired: false
      };
    } else {
      // Payment required
      const paymentOrder = await PaymentIntegrationService.createOrder({
        registrationId: registration.id,
        amount
      });

      return {
        status: 'PENDING_PAYMENT',
        registrationId: registration.id,
        registrationNumber: registration.registration_number,
        paymentRequired: true,
        paymentOrder
      };
    }
  }

  static async getRegistrationDetails(id: string) {
    return await RegistrationRepository.findById(id);
  }
}
