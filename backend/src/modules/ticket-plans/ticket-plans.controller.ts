import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateTicketPlanInput, UpdateTicketPlanInput } from '@scd/validation';
import { ticketPlansService } from './ticket-plans.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const ticketPlansController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await ticketPlansService.list());
  },

  /** Admin -- GET /api/v1/admin/content/ticket-plans */
  async adminList(req: Request, res: Response): Promise<void> {
    const params = req.query as unknown as PaginationQuery;
    sendSuccess(res, await ticketPlansService.adminList(params));
  },

  async create(req: Request, res: Response): Promise<void> {
    const plan = await ticketPlansService.create(req.body as CreateTicketPlanInput);
    await auditLogsService.log(req, 'TICKET_PLAN_CREATED', 'ticket_plan', plan.id, { code: plan.code });
    sendCreated(res, plan, 'Ticket plan created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const plan = await ticketPlansService.update(req.params.id!, req.body as UpdateTicketPlanInput);
    await auditLogsService.log(req, 'TICKET_PLAN_UPDATED', 'ticket_plan', plan.id);
    sendSuccess(res, plan, 'Ticket plan updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await ticketPlansService.remove(req.params.id!);
    await auditLogsService.log(req, 'TICKET_PLAN_DELETED', 'ticket_plan', req.params.id!);
    sendSuccess(res, null, 'Ticket plan deleted.');
  },
};
