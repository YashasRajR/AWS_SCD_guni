import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import { achievementsService } from './achievements.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const achievementsController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    sendSuccess(res, await achievementsService.list(page, pageSize));
  },

  async getById(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await achievementsService.getById(req.params.id!));
  },

  async create(req: Request, res: Response): Promise<void> {
    const achievement = await achievementsService.create(req.body);
    await auditLogsService.log(req, 'ACHIEVEMENT_CREATED', 'achievement', achievement.id, {
      name: achievement.name,
    });
    sendCreated(res, achievement, 'Achievement created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const achievement = await achievementsService.update(req.params.id!, req.body);
    await auditLogsService.log(req, 'ACHIEVEMENT_UPDATED', 'achievement', achievement.id);
    sendSuccess(res, achievement, 'Achievement updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await achievementsService.remove(req.params.id!);
    await auditLogsService.log(req, 'ACHIEVEMENT_DELETED', 'achievement', req.params.id!);
    sendSuccess(res, null, 'Achievement deleted.');
  },

  /** Manually evaluate all achievements for an attendee. */
  async evaluate(req: Request, res: Response): Promise<void> {
    const { attendeeId } = req.params as { attendeeId: string };
    const results = await achievementsService.evaluateForAttendee(attendeeId);
    sendSuccess(res, results);
  },
};
