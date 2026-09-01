import type { Ticket, TicketStatus } from '@scd/types';

export interface TicketRow {
  id: string;
  registration_id: string;
  ticket_number: string;
  status: TicketStatus;
  issued_at: string;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
