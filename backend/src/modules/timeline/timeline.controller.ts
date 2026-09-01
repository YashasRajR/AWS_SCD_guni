import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateTimelineItemInput, UpdateTimelineItemInput } from '@scd/validation';
import { timelineService } from './timeline.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const timelineController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await timelineService.list());
  },

  /** Admin — GET /api/v1/admin/content/timeline */
  async adminList(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    sendSuccess(res, await timelineService.adminList(page, pageSize));
  },

  async create(req: Request, res: Response): Promise<void> {
    const item = await timelineService.create(req.body as CreateTimelineItemInput);
    await auditLogsService.log(req, 'TIMELINE_ITEM_CREATED', 'timeline_item', item.id, {
      title: item.title,
    });
    sendCreated(res, item, 'Timeline item created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const item = await timelineService.update(req.params.id!, req.body as UpdateTimelineItemInput);
    await auditLogsService.log(req, 'TIMELINE_ITEM_UPDATED', 'timeline_item', item.id);
    sendSuccess(res, item, 'Timeline item updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await timelineService.remove(req.params.id!);
    await auditLogsService.log(req, 'TIMELINE_ITEM_DELETED', 'timeline_item', req.params.id!);
    sendSuccess(res, null, 'Timeline item deleted.');
  },
};
