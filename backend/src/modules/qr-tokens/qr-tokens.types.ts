import type { QrScanLog, QrScanResult, QrToken, QrTokenType } from '@scd/types';

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

export interface QrScanLogRow {
  id: string;
  qr_token_id: string | null;
  type: QrTokenType;
  volunteer_id: string | null;
  checkpoint_id: string | null;
  attendee_id: string | null;
  result: QrScanResult;
  created_at: string;
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

export function toQrScanLog(row: QrScanLogRow): QrScanLog {
  return {
    id: row.id,
    qrTokenId: row.qr_token_id,
    type: row.type,
    volunteerId: row.volunteer_id,
    checkpointId: row.checkpoint_id,
    attendeeId: row.attendee_id,
    result: row.result,
    createdAt: row.created_at,
  };
}
