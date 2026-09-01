import { describe, it, expect } from 'vitest';
import { RegistrationService } from '../../../backend/src/modules/registrations/registration.service.js';
import { TicketsService } from '../../../backend/src/modules/tickets/tickets.service.js';

describe('Phase 4: Registration, Payment, Ticket & Email Workflow', () => {
  it('generates unique registration numbers in the correct format', () => {
    const regNum = RegistrationService.generateRegistrationNumber();
    expect(regNum).toMatch(/^SCD2026-REG-\d{6}$/);
  });

  it('generates unique ticket numbers in the correct format', () => {
    const ticketNum = TicketsService.generateTicketNumber();
    expect(ticketNum).toMatch(/^SCD2026-TKT-\d{6}$/);
    expect(ticketNum).not.toContain('QR');
    expect(ticketNum).not.toContain('NFC');
  });
});
