import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from '@scd/validation';
import { announcementsService } from './announcements.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const announcementsController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await announcementsService.list());
  },

  /** Admin — GET /api/v1/admin/content/announcements */
  async adminList(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    sendSuccess(res, await announcementsService.adminList(page, pageSize));
  },

  async create(req: Request, res: Response): Promise<void> {
    const announcement = await announcementsService.create(req.body as CreateAnnouncementInput);
    await auditLogsService.log(req, 'ANNOUNCEMENT_CREATED', 'announcement', announcement.id, {
      title: announcement.title,
    });
    sendCreated(res, announcement, 'Announcement created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const announcement = await announcementsService.update(
      req.params.id!,
      req.body as UpdateAnnouncementInput,
    );
    await auditLogsService.log(req, 'ANNOUNCEMENT_UPDATED', 'announcement', announcement.id);
    sendSuccess(res, announcement, 'Announcement updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await announcementsService.remove(req.params.id!);
    await auditLogsService.log(req, 'ANNOUNCEMENT_DELETED', 'announcement', req.params.id!);
    sendSuccess(res, null, 'Announcement deleted.');
  },
};
