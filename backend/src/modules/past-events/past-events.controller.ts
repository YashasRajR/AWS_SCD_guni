import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreatePastEventInput, UpdatePastEventInput } from '@scd/validation';
import { pastEventsService } from './past-events.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const pastEventsController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await pastEventsService.list());
  },

  async adminList(req: Request, res: Response): Promise<void> {
    const params = req.query as unknown as PaginationQuery;
    sendSuccess(res, await pastEventsService.adminList(params));
  },

  async create(req: Request, res: Response): Promise<void> {
    const item = await pastEventsService.create(req.body as CreatePastEventInput);
    await auditLogsService.log(req, 'PAST_EVENT_CREATED', 'past_event', item.id, {});
    sendCreated(res, item, 'Past event created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const item = await pastEventsService.update(req.params.id!, req.body as UpdatePastEventInput);
    await auditLogsService.log(req, 'PAST_EVENT_UPDATED', 'past_event', item.id);
    sendSuccess(res, item, 'Past event updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await pastEventsService.remove(req.params.id!);
    await auditLogsService.log(req, 'PAST_EVENT_DELETED', 'past_event', req.params.id!);
    sendSuccess(res, null, 'Past event deleted.');
  },
};
