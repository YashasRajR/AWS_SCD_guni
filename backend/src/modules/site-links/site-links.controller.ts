import type { Request, Response } from 'express';
import type { SiteLinkKind } from '@scd/types';
import type { PaginationQuery, CreateSiteLinkInput, UpdateSiteLinkInput } from '@scd/validation';
import { siteLinksService } from './site-links.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

/** A controller bound to one `kind` — see site-links.routes.ts for why NAV
 * and SOCIAL each get their own mounted router rather than a client-
 * supplied `kind` field. */
export function createSiteLinksController(kind: SiteLinkKind) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      sendSuccess(res, await siteLinksService.list(kind));
    },

    async adminList(req: Request, res: Response): Promise<void> {
      const params = req.query as unknown as PaginationQuery;
      sendSuccess(res, await siteLinksService.adminList(kind, params));
    },

    async create(req: Request, res: Response): Promise<void> {
      const link = await siteLinksService.create(kind, req.body as CreateSiteLinkInput);
      await auditLogsService.log(req, 'SITE_LINK_CREATED', 'site_link', link.id, { kind, label: link.label });
      sendCreated(res, link, 'Link created.');
    },

    async update(req: Request, res: Response): Promise<void> {
      const link = await siteLinksService.update(kind, req.params.id!, req.body as UpdateSiteLinkInput);
      await auditLogsService.log(req, 'SITE_LINK_UPDATED', 'site_link', link.id);
      sendSuccess(res, link, 'Link updated.');
    },

    async remove(req: Request, res: Response): Promise<void> {
      await siteLinksService.remove(kind, req.params.id!);
      await auditLogsService.log(req, 'SITE_LINK_DELETED', 'site_link', req.params.id!);
      sendSuccess(res, null, 'Link deleted.');
    },
  };
}
