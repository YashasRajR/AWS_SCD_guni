import type { Request, Response } from 'express';
import type { AttendeesListQuery, ArchiveAttendeeInput, UpdateAttendeeInput } from '@scd/validation';
import { attendeesService } from './attendees.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendSuccess } from '../../utils/response.js';

export const attendeesController = {
  async exportCsv(_req: Request, res: Response): Promise<void> {
    const csv = await attendeesService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="attendees.csv"');
    res.send(csv);
  },

  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize, search, archived } = req.query as unknown as AttendeesListQuery;
    const data = await attendeesService.list(page, pageSize, search, archived);
    sendSuccess(res, data);
  },

  async getDetail(req: Request, res: Response): Promise<void> {
    const detail = await attendeesService.getDetail(req.params.id as string);
    sendSuccess(res, detail);
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const attendee = await attendeesService.update(id, req.body as UpdateAttendeeInput);
    await auditLogsService.log(req, 'ATTENDEE_UPDATED', 'attendee', id, { patch: req.body });
    sendSuccess(res, attendee);
  },

  async archive(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { reason } = req.body as ArchiveAttendeeInput;
    const attendee = await attendeesService.archive(id);
    await auditLogsService.log(req, 'ATTENDEE_ARCHIVED', 'attendee', id, { reason: reason ?? null });
    sendSuccess(res, attendee);
  },

  async restore(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const attendee = await attendeesService.restore(id);
    await auditLogsService.log(req, 'ATTENDEE_RESTORED', 'attendee', id);
    sendSuccess(res, attendee);
  },

  async resetAccess(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    await attendeesService.resetAccess(id);
    await auditLogsService.log(req, 'ATTENDEE_ACCESS_RESET', 'attendee', id);
    sendSuccess(res, { ok: true });
  },
};
