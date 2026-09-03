import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateFaqInput, UpdateFaqInput } from '@scd/validation';
import { faqService } from './faq.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const faqController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await faqService.list());
  },

  /** Admin — GET /api/v1/admin/content/faqs */
  async adminList(req: Request, res: Response): Promise<void> {
    const params = req.query as unknown as PaginationQuery;
    sendSuccess(res, await faqService.adminList(params));
  },

  async create(req: Request, res: Response): Promise<void> {
    const faq = await faqService.create(req.body as CreateFaqInput);
    await auditLogsService.log(req, 'FAQ_CREATED', 'faq', faq.id, { question: faq.question });
    sendCreated(res, faq, 'FAQ created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const faq = await faqService.update(req.params.id!, req.body as UpdateFaqInput);
    await auditLogsService.log(req, 'FAQ_UPDATED', 'faq', faq.id);
    sendSuccess(res, faq, 'FAQ updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await faqService.remove(req.params.id!);
    await auditLogsService.log(req, 'FAQ_DELETED', 'faq', req.params.id!);
    sendSuccess(res, null, 'FAQ deleted.');
  },
};
