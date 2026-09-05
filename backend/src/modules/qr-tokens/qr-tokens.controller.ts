import type { Request, Response } from 'express';
import { qrTokensService } from './qr-tokens.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendSuccess } from '../../utils/response.js';

export const qrTokensController = {
  async listForTicket(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await qrTokensService.listForTicket(req.params.ticketId!));
  },

  /** Revoke-and-reissue for one ticket/type — e.g. resending a lost ticket. */
  async rotate(req: Request, res: Response): Promise<void> {
    const { ticketId, type } = req.params as { ticketId: string; type: 'REGISTRATION' | 'GOODIE' };
    const { token, rawToken } = await qrTokensService.rotate(ticketId, type);
    await auditLogsService.log(req, 'QR_TOKEN_ROTATED', 'qr_token', token.id, { ticketId, type });
    // rawToken is returned exactly once — the caller (e.g. a resend-ticket
    // email job) must use it now or lose it; only the hash is ever stored.
    sendSuccess(res, { token, rawToken });
  },

  async revoke(req: Request, res: Response): Promise<void> {
    const token = await qrTokensService.revoke(req.params.id!);
    await auditLogsService.log(req, 'QR_TOKEN_REVOKED', 'qr_token', token.id, {});
    sendSuccess(res, token);
  },
};
