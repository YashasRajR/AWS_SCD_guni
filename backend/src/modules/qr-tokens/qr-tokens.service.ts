import type { QrToken, QrTokenType } from '@scd/types';
import { AppError } from '../../utils/errors.js';
import { qrTokensRepository } from './qr-tokens.repository.js';
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
      // null = a concurrent issueForTicket() for this ticket won the race;
      // that call already has the raw token, so there's nothing for this
      // call to hand back -- same as the existing-token branch above.
      const result = await qrTokensRepository.issue(ticketId, type);
      if (result) issued.push({ type, rawToken: result.rawToken });
    }
    return issued;
  },

  async listForTicket(ticketId: string): Promise<QrToken[]> {
    return (await qrTokensRepository.findByTicketId(ticketId)).map(toQrToken);
  },

  /** Admin action: revoke-and-reissue. Returns the new raw token once. */
  async rotate(ticketId: string, type: QrTokenType): Promise<{ token: QrToken; rawToken: string }> {
    const result = await qrTokensRepository.issue(ticketId, type);
    if (!result) throw AppError.duplicate('This token was just rotated by another request. Try again.');
    return { token: toQrToken(result.row), rawToken: result.rawToken };
  },

  /**
   * Rotates both token types together — used when regenerating a ticket's
   * PDF, since the PDF embeds both QR codes and a stale one would defeat
   * the point of rotating either.
   */
  async rotateBoth(ticketId: string): Promise<{ registrationToken: string; goodieToken: string }> {
    const [registration, goodie] = await Promise.all([
      qrTokensRepository.issue(ticketId, 'REGISTRATION'),
      qrTokensRepository.issue(ticketId, 'GOODIE'),
    ]);
    if (!registration || !goodie) {
      throw AppError.duplicate('This ticket\'s tokens were just rotated by another request. Try again.');
    }
    return { registrationToken: registration.rawToken, goodieToken: goodie.rawToken };
  },

  async revoke(id: string): Promise<QrToken> {
    const row = await qrTokensRepository.revoke(id);
    if (!row) throw AppError.notFound('QR token');
    return toQrToken(row);
  },
};
