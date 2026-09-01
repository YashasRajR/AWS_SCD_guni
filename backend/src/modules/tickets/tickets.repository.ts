import { getPool } from '../../config/database.js';
import { generateReferenceCode } from '@scd/utils';
import type { TicketRow } from './tickets.types.js';

export const ticketsRepository = {
  async findByRegistrationId(registrationId: string): Promise<TicketRow | null> {
    const { rows } = await getPool().query<TicketRow>(
      'SELECT * FROM tickets WHERE registration_id = $1',
      [registrationId],
    );
    return rows[0] ?? null;
  },

  // DO NOT add QR/NFC fields here — tickets are identified by ticket_number only.
  async issue(registrationId: string): Promise<TicketRow> {
    const { rows } = await getPool().query<TicketRow>(
      `INSERT INTO tickets (registration_id, ticket_number)
       VALUES ($1, $2)
       RETURNING *`,
      [registrationId, generateReferenceCode('TCK')],
    );
    return rows[0]!;
  },
};
