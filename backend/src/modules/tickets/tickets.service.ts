import { TicketsRepository } from './tickets.repository.js';

export class TicketsService {
  static generateTicketNumber(): string {
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString();
    return `SCD2026-TKT-${randomHex}`;
  }

  static async issueTicketForRegistration(registrationId: string) {
    const ticketNumber = this.generateTicketNumber();
    const ticket = await TicketsRepository.createTicket(registrationId, ticketNumber);
    return ticket;
  }

  static async getTicketByRegistrationId(registrationId: string) {
    return await TicketsRepository.findByRegistrationId(registrationId);
  }

  static async getTicketByNumber(ticketNumber: string) {
    return await TicketsRepository.findByTicketNumber(ticketNumber);
  }
}
