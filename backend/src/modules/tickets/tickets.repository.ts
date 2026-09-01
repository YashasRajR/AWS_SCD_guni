import { pool } from '../../config/database.js';

export class TicketsRepository {
  static async createTicket(registrationId: string, ticketNumber: string) {
    const query = `
      INSERT INTO tickets (registration_id, ticket_number, status, issued_at)
      VALUES ($1, $2, 'ISSUED', now())
      ON CONFLICT (registration_id) DO UPDATE SET updated_at = now()
      RETURNING *;
    `;
    const res = await pool.query(query, [registrationId, ticketNumber]);
    return res.rows[0];
  }

  static async findByRegistrationId(registrationId: string) {
    const query = `
      SELECT t.*, r.registration_number, r.status as registration_status, a.full_name, a.university, a.department, a.registration_type, e.name as event_name, e.event_date, e.venue
      FROM tickets t
      JOIN registrations r ON t.registration_id = r.id
      JOIN attendees a ON r.attendee_id = a.id
      JOIN events e ON a.event_id = e.id
      WHERE t.registration_id = $1;
    `;
    const res = await pool.query(query, [registrationId]);
    return res.rows[0] || null;
  }

  static async findByTicketNumber(ticketNumber: string) {
    const query = `
      SELECT t.*, r.registration_number, r.status as registration_status, a.full_name, a.university, a.department, a.registration_type, e.name as event_name, e.event_date, e.venue
      FROM tickets t
      JOIN registrations r ON t.registration_id = r.id
      JOIN attendees a ON r.attendee_id = a.id
      JOIN events e ON a.event_id = e.id
      WHERE t.ticket_number = $1;
    `;
    const res = await pool.query(query, [ticketNumber]);
    return res.rows[0] || null;
  }
}
