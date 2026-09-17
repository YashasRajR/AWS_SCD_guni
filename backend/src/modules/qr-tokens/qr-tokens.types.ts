import type { QrToken, QrTokenType } from '@scd/types';

export interface QrTokenRow {
  id: string;
  ticket_id: string;
  type: QrTokenType;
  token_hash: string;
  status: 'ACTIVE' | 'REVOKED';
  issued_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Public shape — token_hash never leaves the repository. */
export function toQrToken(row: QrTokenRow): QrToken {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    type: row.type,
    status: row.status,
    issuedAt: row.issued_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
