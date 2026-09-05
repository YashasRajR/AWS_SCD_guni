import type { Ticket, TicketStatus } from '@scd/types';

export interface TicketRow {
  id: string;
  registration_id: string;
  ticket_number: string;
  status: TicketStatus;
  issued_at: string;
  pdf_data: Buffer | null;
  pdf_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    registrationId: row.registration_id,
    ticketNumber: row.ticket_number,
    status: row.status,
    issuedAt: row.issued_at,
    pdfAvailable: row.pdf_data != null,
    pdfGeneratedAt: row.pdf_generated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
