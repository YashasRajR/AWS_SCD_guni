import { randomBytes, createHash } from 'node:crypto';
import { getPool, withTransaction } from '../../config/database.js';
import type { QrTokenType } from '@scd/types';
import type { QrTokenRow } from './qr-tokens.types.js';

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function generateRawToken(): string {
  return randomBytes(32).toString('base64url');
}

export const qrTokensRepository = {
  async findActiveByTicketAndType(ticketId: string, type: QrTokenType): Promise<QrTokenRow | null> {
    const { rows } = await getPool().query<QrTokenRow>(
      `SELECT * FROM qr_tokens WHERE ticket_id = $1 AND type = $2 AND status = 'ACTIVE'`,
      [ticketId, type],
    );
    return rows[0] ?? null;
  },

  async findByTicketId(ticketId: string): Promise<QrTokenRow[]> {
    const { rows } = await getPool().query<QrTokenRow>(
      'SELECT * FROM qr_tokens WHERE ticket_id = $1 ORDER BY type',
      [ticketId],
    );
    return rows;
  },

  /**
   * Rotates the active token for (ticketId, type): revokes whatever is
   * currently ACTIVE, then inserts a fresh one. Both statements run in one
   * transaction so a reader never observes a moment with zero active
   * tokens or two. Returns the raw token — the only time it ever exists
   * outside a hash.
   *
   * Two concurrent issue() calls for the same (ticketId, type) (e.g. a
   * webhook and an admin retry both confirming the same payment) can both
   * pass the UPDATE with no ACTIVE row left to revoke and then both try to
   * INSERT one -- only one can win qr_tokens_unique_active. The losing
   * INSERT relies on ON CONFLICT ... DO NOTHING instead of throwing a raw
   * unique-violation; returns null so the caller (who has no way to learn
   * the winner's raw token) can decide what "someone else already issued
   * it" means for them.
   */
  async issue(ticketId: string, type: QrTokenType): Promise<{ row: QrTokenRow; rawToken: string } | null> {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const row = await withTransaction(async (client) => {
      await client.query(
        `UPDATE qr_tokens SET status = 'REVOKED', revoked_at = now()
         WHERE ticket_id = $1 AND type = $2 AND status = 'ACTIVE'`,
        [ticketId, type],
      );
      const { rows } = await client.query<QrTokenRow>(
        `INSERT INTO qr_tokens (ticket_id, type, token_hash) VALUES ($1, $2, $3)
         ON CONFLICT (ticket_id, type) WHERE status = 'ACTIVE' DO NOTHING
         RETURNING *`,
        [ticketId, type, tokenHash],
      );
      return rows[0] ?? null;
    });
    return row ? { row, rawToken } : null;
  },

  async revoke(id: string): Promise<QrTokenRow | null> {
    const { rows } = await getPool().query<QrTokenRow>(
      `UPDATE qr_tokens SET status = 'REVOKED', revoked_at = now()
       WHERE id = $1 AND status = 'ACTIVE' RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  },
};
