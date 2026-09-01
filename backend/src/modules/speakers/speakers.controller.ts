import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateSpeakerInput, UpdateSpeakerInput } from '@scd/validation';
import { speakersService } from './speakers.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const speakersController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await speakersService.list());
  },
  async getById(req: Request, res: Response): Promise<void> {
    sendSuccess(res, await speakersService.getById(req.params.id!));
  },

  /** Admin — GET /api/v1/admin/content/speakers */
  async adminList(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    sendSuccess(res, await speakersService.adminList(page, pageSize));
  },

  async create(req: Request, res: Response): Promise<void> {
    const speaker = await speakersService.create(req.body as CreateSpeakerInput);
    await auditLogsService.log(req, 'SPEAKER_CREATED', 'speaker', speaker.id, { name: speaker.name });
    sendCreated(res, speaker, 'Speaker created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const speaker = await speakersService.update(req.params.id!, req.body as UpdateSpeakerInput);
    await auditLogsService.log(req, 'SPEAKER_UPDATED', 'speaker', speaker.id);
    sendSuccess(res, speaker, 'Speaker updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await speakersService.remove(req.params.id!);
    await auditLogsService.log(req, 'SPEAKER_DELETED', 'speaker', req.params.id!);
    sendSuccess(res, null, 'Speaker deleted.');
  },
};
