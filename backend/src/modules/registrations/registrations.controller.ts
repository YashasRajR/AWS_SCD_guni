import type { Request, Response } from 'express';
import type { PaginationQuery, UpdateRegistrationStatusInput } from '@scd/validation';
import { registrationsService } from './registrations.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendSuccess } from '../../utils/response.js';

export const registrationsController = {
  async exportCsv(_req: Request, res: Response): Promise<void> {
    const csv = await registrationsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
    res.send(csv);
  },

  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    const data = await registrationsService.list(page, pageSize);
    sendSuccess(res, data);
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const registration = await registrationsService.updateStatus(
      req.params.id!,
      req.body as UpdateRegistrationStatusInput,
    );
    await auditLogsService.log(req, 'REGISTRATION_STATUS_UPDATED', 'registration', registration.id, {
      status: registration.status,
    });
    sendSuccess(res, registration, 'Registration status updated.');
  },
};
