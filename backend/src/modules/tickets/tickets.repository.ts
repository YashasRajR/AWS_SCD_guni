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

  async list(page: number, pageSize: number): Promise<{ rows: TicketRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<TicketRow>(
        'SELECT * FROM tickets ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM tickets'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
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
