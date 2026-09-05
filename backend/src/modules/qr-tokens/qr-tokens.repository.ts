import { randomBytes, createHash } from 'node:crypto';
import { getPool, withTransaction } from '../../config/database.js';
import type { QrTokenType, QrScanResult } from '@scd/types';
import type { QrScanLogRow, QrTokenRow } from './qr-tokens.types.js';

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

  async findByHash(tokenHash: string): Promise<QrTokenRow | null> {
    const { rows } = await getPool().query<QrTokenRow>(
      'SELECT * FROM qr_tokens WHERE token_hash = $1',
      [tokenHash],
    );
    return rows[0] ?? null;
  },

  /**
   * Rotates the active token for (ticketId, type): revokes whatever is
   * currently ACTIVE, then inserts a fresh one. Both statements run in one
   * transaction so a reader never observes a moment with zero active
   * tokens or two. Returns the raw token — the only time it ever exists
   * outside a hash.
   */
  async issue(ticketId: string, type: QrTokenType): Promise<{ row: QrTokenRow; rawToken: string }> {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const row = await withTransaction(async (client) => {
      await client.query(
        `UPDATE qr_tokens SET status = 'REVOKED', revoked_at = now()
         WHERE ticket_id = $1 AND type = $2 AND status = 'ACTIVE'`,
        [ticketId, type],
      );
      const { rows } = await client.query<QrTokenRow>(
        `INSERT INTO qr_tokens (ticket_id, type, token_hash) VALUES ($1, $2, $3) RETURNING *`,
        [ticketId, type, tokenHash],
      );
      return rows[0]!;
    });
    return { row, rawToken };
  },

  async revoke(id: string): Promise<QrTokenRow | null> {
    const { rows } = await getPool().query<QrTokenRow>(
      `UPDATE qr_tokens SET status = 'REVOKED', revoked_at = now()
       WHERE id = $1 AND status = 'ACTIVE' RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  },

  async logScan(entry: {
    qrTokenId: string | null;
    type: QrTokenType;
    volunteerId: string | null;
    checkpointId: string | null;
    attendeeId: string | null;
    result: QrScanResult;
  }): Promise<QrScanLogRow> {
    const { rows } = await getPool().query<QrScanLogRow>(
      `INSERT INTO qr_scan_logs (qr_token_id, type, volunteer_id, checkpoint_id, attendee_id, result)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        entry.qrTokenId,
        entry.type,
        entry.volunteerId,
        entry.checkpointId,
        entry.attendeeId,
        entry.result,
      ],
    );
    return rows[0]!;
  },
};
