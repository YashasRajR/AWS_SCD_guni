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
  //
  // Race-safe: two concurrent callers (e.g. a payment webhook retry racing
  // an admin's manual confirm) can both reach this with no existing ticket
  // yet. `tickets_registration_id_unique` is the real backstop -- ON
  // CONFLICT DO NOTHING makes the loser a silent no-op instead of an
  // unhandled 23505 error, then we re-select so both callers get the same
  // (single) issued ticket back rather than one of them throwing.
  async issue(registrationId: string): Promise<TicketRow> {
    const { rows } = await getPool().query<TicketRow>(
      `INSERT INTO tickets (registration_id, ticket_number)
       VALUES ($1, $2)
       ON CONFLICT (registration_id) DO NOTHING
       RETURNING *`,
      [registrationId, generateReferenceCode('TCK')],
    );
    if (rows[0]) return rows[0];
    const existing = await ticketsRepository.findByRegistrationId(registrationId);
    if (!existing) throw new Error(`Ticket insert conflicted for registration ${registrationId} but no row found`);
    return existing;
  },
};
