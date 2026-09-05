import type { QrToken, QrTokenType } from '@scd/types';
import { AppError } from '../../utils/errors.js';
import { ticketsRepository } from '../tickets/tickets.repository.js';
import { registrationsRepository } from '../registrations/registrations.repository.js';
import { hashToken, qrTokensRepository } from './qr-tokens.repository.js';
import { toQrToken } from './qr-tokens.types.js';

const QR_TOKEN_TYPES: QrTokenType[] = ['REGISTRATION', 'GOODIE'];

export const qrTokensService = {
  /**
   * Called once from ticketsService.issueIfNeeded. Idempotent per type: a
   * ticket that already has an ACTIVE token of a given type keeps it — use
   * rotate() to deliberately replace one (e.g. resending a lost ticket).
   * Returns the raw tokens only for types actually issued this call, since
   * a raw token exists nowhere after the moment it's generated.
   */
  async issueForTicket(ticketId: string): Promise<{ type: QrTokenType; rawToken: string }[]> {
    const issued: { type: QrTokenType; rawToken: string }[] = [];
    for (const type of QR_TOKEN_TYPES) {
      const existing = await qrTokensRepository.findActiveByTicketAndType(ticketId, type);
      if (existing) continue;
      const { rawToken } = await qrTokensRepository.issue(ticketId, type);
      issued.push({ type, rawToken });
    }
    return issued;
  },

  async listForTicket(ticketId: string): Promise<QrToken[]> {
    return (await qrTokensRepository.findByTicketId(ticketId)).map(toQrToken);
  },

  /** Admin action: revoke-and-reissue. Returns the new raw token once. */
  async rotate(ticketId: string, type: QrTokenType): Promise<{ token: QrToken; rawToken: string }> {
    const { row, rawToken } = await qrTokensRepository.issue(ticketId, type);
    return { token: toQrToken(row), rawToken };
  },

  async revoke(id: string): Promise<QrToken> {
    const row = await qrTokensRepository.revoke(id);
    if (!row) throw AppError.notFound('QR token');
    return toQrToken(row);
  },

  /**
   * Resolves a raw scanned token to the attendee it belongs to. Only
   * validates the token itself (exists, right type, ACTIVE) — logs and
   * throws for INVALID/REVOKED here since there's nothing further to
   * attempt; a valid token's actual checkpoint outcome (already used, not
   * assigned, etc.) is logged by the caller after it acts on the result.
   */
  async resolve(
    rawToken: string,
    expectedType: QrTokenType,
    ctx: { volunteerId: string | null; checkpointId: string | null },
  ): Promise<{ attendeeId: string; qrTokenId: string }> {
    const tokenRow = await qrTokensRepository.findByHash(hashToken(rawToken));

    if (!tokenRow || tokenRow.type !== expectedType) {
      await qrTokensRepository.logScan({
        qrTokenId: null,
        type: expectedType,
        attendeeId: null,
        ...ctx,
        result: 'INVALID',
      });
      throw AppError.qrTokenInvalid();
    }
    if (tokenRow.status !== 'ACTIVE') {
      await qrTokensRepository.logScan({
        qrTokenId: tokenRow.id,
        type: expectedType,
        attendeeId: null,
        ...ctx,
        result: 'REVOKED',
      });
      throw AppError.qrTokenRevoked();
    }

    const ticket = await ticketsRepository.findById(tokenRow.ticket_id);
    const registration = ticket
      ? await registrationsRepository.findById(ticket.registration_id)
      : null;
    if (!registration) {
      // FK guarantees this can't happen in practice; treat as invalid rather
      // than 500 if it ever does.
      await qrTokensRepository.logScan({
        qrTokenId: tokenRow.id,
        type: expectedType,
        attendeeId: null,
        ...ctx,
        result: 'INVALID',
      });
      throw AppError.qrTokenInvalid();
    }

    return { attendeeId: registration.attendee_id, qrTokenId: tokenRow.id };
  },

  async logScan(entry: {
    qrTokenId: string | null;
    type: QrTokenType;
    volunteerId: string | null;
    checkpointId: string | null;
    attendeeId: string | null;
    result: 'SUCCESS' | 'ALREADY_USED' | 'CHECKPOINT_INACTIVE' | 'NOT_ASSIGNED';
  }): Promise<void> {
    await qrTokensRepository.logScan(entry);
  },
};
