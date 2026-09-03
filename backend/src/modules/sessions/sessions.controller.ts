import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateSessionInput, UpdateSessionInput } from '@scd/validation';
import { sessionsService } from './sessions.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const sessionsController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await sessionsService.list());
  },
  async getById(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await sessionsService.getById(req.params.id!));
  },

  /** Admin — GET /api/v1/admin/content/sessions */
  async adminList(req: Request, res: Response): Promise<void> {
    const params = req.query as unknown as PaginationQuery;
    sendSuccess(res, await sessionsService.adminList(params));
  },

  async create(req: Request, res: Response): Promise<void> {
    const session = await sessionsService.create(req.body as CreateSessionInput);
    await auditLogsService.log(req, 'SESSION_CREATED', 'session', session.id, { title: session.title });
    sendCreated(res, session, 'Session created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const session = await sessionsService.update(req.params.id!, req.body as UpdateSessionInput);
    await auditLogsService.log(req, 'SESSION_UPDATED', 'session', session.id);
    sendSuccess(res, session, 'Session updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await sessionsService.remove(req.params.id!);
    await auditLogsService.log(req, 'SESSION_DELETED', 'session', req.params.id!);
    sendSuccess(res, null, 'Session deleted.');
  },
};
