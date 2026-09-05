import { getPool } from '../../config/database.js';
import { generateReferenceCode } from '@scd/utils';
import type { TicketRow } from './tickets.types.js';

// Excludes pdf_data — every list/lookup query below fetches it explicitly
// only when it's actually needed (findPdfData), so paginated listings
// don't drag a ~50-100KB blob along per row.
const TICKET_COLUMNS = `
  id, registration_id, ticket_number, status, issued_at,
  pdf_generated_at, created_at, updated_at,
  NULL::bytea AS pdf_data
`;

export const ticketsRepository = {
  async findByRegistrationId(registrationId: string): Promise<TicketRow | null> {
    const { rows } = await getPool().query<TicketRow>(
      `SELECT ${TICKET_COLUMNS} FROM tickets WHERE registration_id = $1`,
      [registrationId],
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<TicketRow | null> {
    const { rows } = await getPool().query<TicketRow>(
      `SELECT ${TICKET_COLUMNS} FROM tickets WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  async findPdfData(id: string): Promise<Buffer | null> {
    const { rows } = await getPool().query<{ pdf_data: Buffer | null }>(
      'SELECT pdf_data FROM tickets WHERE id = $1',
      [id],
    );
    return rows[0]?.pdf_data ?? null;
  },

  async setPdfData(id: string, pdf: Buffer): Promise<void> {
    await getPool().query('UPDATE tickets SET pdf_data = $1, pdf_generated_at = now() WHERE id = $2', [
      pdf,
      id,
    ]);
  },

  async list(page: number, pageSize: number): Promise<{ rows: TicketRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<TicketRow>(
        `SELECT ${TICKET_COLUMNS} FROM tickets ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM tickets'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  // QR check-in tokens live in the separate qr_tokens table (module
  // qr-tokens), not as columns on this row — a ticket can be identified by
  // ticket_number alone, and rotating/revoking a QR token must never touch
  // this table. (Earlier phases forbade QR/NFC outright; superseded — see
  // qr-tokens module.)
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
       RETURNING id, registration_id, ticket_number, status, issued_at,
                 pdf_generated_at, created_at, updated_at, NULL::bytea AS pdf_data`,
      [registrationId, generateReferenceCode('TCK')],
    );
    if (rows[0]) return rows[0];
    const existing = await ticketsRepository.findByRegistrationId(registrationId);
    if (!existing) throw new Error(`Ticket insert conflicted for registration ${registrationId} but no row found`);
    return existing;
  },
};
