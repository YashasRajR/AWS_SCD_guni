import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateEventInput, UpdateEventInput } from '@scd/validation';
import { eventService } from './event.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const eventController = {
  async getCurrent(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await eventService.getCurrent());
  },

  /** Admin — GET /api/v1/admin/content/event */
  async list(req: Request, res: Response): Promise<void> {
    const params = req.query as unknown as PaginationQuery;
    sendSuccess(res, await eventService.list(params));
  },

  async getById(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await eventService.getById(req.params.id!));
  },

  async create(req: Request, res: Response): Promise<void> {
    const event = await eventService.create(req.body as CreateEventInput);
    await auditLogsService.log(req, 'EVENT_CREATED', 'event', event.id, { name: event.name });
    sendCreated(res, event, 'Event created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const event = await eventService.update(req.params.id!, req.body as UpdateEventInput);
    await auditLogsService.log(req, 'EVENT_UPDATED', 'event', event.id);
    sendSuccess(res, event, 'Event updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await eventService.remove(req.params.id!);
    await auditLogsService.log(req, 'EVENT_DELETED', 'event', req.params.id!);
    sendSuccess(res, null, 'Event deleted.');
  },
};
