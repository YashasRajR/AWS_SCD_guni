import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateAgendaItemInput, UpdateAgendaItemInput } from '@scd/validation';
import { agendaService } from './agenda.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const agendaController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await agendaService.list());
  },

  /** Admin — GET /api/v1/admin/content/agenda */
  async adminList(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    sendSuccess(res, await agendaService.adminList(page, pageSize));
  },

  async create(req: Request, res: Response): Promise<void> {
    const item = await agendaService.create(req.body as CreateAgendaItemInput);
    await auditLogsService.log(req, 'AGENDA_ITEM_CREATED', 'agenda_item', item.id, { title: item.title });
    sendCreated(res, item, 'Agenda item created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const item = await agendaService.update(req.params.id!, req.body as UpdateAgendaItemInput);
    await auditLogsService.log(req, 'AGENDA_ITEM_UPDATED', 'agenda_item', item.id);
    sendSuccess(res, item, 'Agenda item updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await agendaService.remove(req.params.id!);
    await auditLogsService.log(req, 'AGENDA_ITEM_DELETED', 'agenda_item', req.params.id!);
    sendSuccess(res, null, 'Agenda item deleted.');
  },
};
