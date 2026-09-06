import type { Request, Response } from 'express';
import type { PaginationQuery, CreateAboutSectionInput, UpdateAboutSectionInput } from '@scd/validation';
import { aboutSectionsService } from './about-sections.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const aboutSectionsController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await aboutSectionsService.list());
  },

  async adminList(req: Request, res: Response): Promise<void> {
    const params = req.query as unknown as PaginationQuery;
    sendSuccess(res, await aboutSectionsService.adminList(params));
  },

  async create(req: Request, res: Response): Promise<void> {
    const item = await aboutSectionsService.create(req.body as CreateAboutSectionInput);
    await auditLogsService.log(req, 'ABOUT_SECTION_CREATED', 'about_section', item.id, {});
    sendCreated(res, item, 'About section created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const item = await aboutSectionsService.update(req.params.id!, req.body as UpdateAboutSectionInput);
    await auditLogsService.log(req, 'ABOUT_SECTION_UPDATED', 'about_section', item.id);
    sendSuccess(res, item, 'About section updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await aboutSectionsService.remove(req.params.id!);
    await auditLogsService.log(req, 'ABOUT_SECTION_DELETED', 'about_section', req.params.id!);
    sendSuccess(res, null, 'About section deleted.');
  },
};
