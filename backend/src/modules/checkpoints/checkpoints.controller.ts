import type { Request, Response } from 'express';
import { checkpointsRepository } from './checkpoints.repository.js';
import { checkpointsService } from './checkpoints.service.js';
import { toCheckpoint } from './checkpoints.types.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';
import type { PaginationQuery, CreateCheckpointInput, UpdateCheckpointInput } from '@scd/validation';

export const checkpointsController = {
  /** Admin listing — GET /api/v1/admin/checkpoints */
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    const { rows, total } = await checkpointsRepository.list(page, pageSize);
    sendSuccess(res, {
      items: rows.map(toCheckpoint),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const checkpoint = await checkpointsService.create(req.body as CreateCheckpointInput);
    await auditLogsService.log(req, 'CHECKPOINT_CREATED', 'checkpoint', checkpoint.id, {
      name: checkpoint.name,
    });
    sendCreated(res, checkpoint, 'Checkpoint created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const checkpoint = await checkpointsService.update(req.params.id!, req.body as UpdateCheckpointInput);
    await auditLogsService.log(req, 'CHECKPOINT_UPDATED', 'checkpoint', checkpoint.id);
    sendSuccess(res, checkpoint, 'Checkpoint updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await checkpointsService.remove(req.params.id!);
    await auditLogsService.log(req, 'CHECKPOINT_DELETED', 'checkpoint', req.params.id!);
    sendSuccess(res, null, 'Checkpoint deleted.');
  },
};
