import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import { certificatesService } from './certificates.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const certificatesController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    sendSuccess(res, await certificatesService.list(page, pageSize));
  },

  async issue(req: Request, res: Response): Promise<void> {
    const certificate = await certificatesService.issue(req.body);
    await auditLogsService.log(req, 'CERTIFICATE_ISSUED', 'certificate', certificate.id, {
      attendeeId: certificate.attendeeId,
      certificateType: certificate.certificateType,
    });
    sendCreated(res, certificate, 'Certificate issued.');
  },

  async revoke(req: Request, res: Response): Promise<void> {
    const certificate = await certificatesService.revoke(req.params.id!);
    await auditLogsService.log(req, 'CERTIFICATE_REVOKED', 'certificate', certificate.id);
    sendSuccess(res, certificate, 'Certificate revoked.');
  },

  async getById(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await certificatesService.getById(req.params.id!));
  },
};
