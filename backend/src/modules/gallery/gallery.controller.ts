import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateGalleryItemInput, UpdateGalleryItemInput } from '@scd/validation';
import { galleryService } from './gallery.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const galleryController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await galleryService.list());
  },

  async adminList(req: Request, res: Response): Promise<void> {
    const params = req.query as unknown as PaginationQuery;
    sendSuccess(res, await galleryService.adminList(params));
  },

  async create(req: Request, res: Response): Promise<void> {
    const item = await galleryService.create(req.body as CreateGalleryItemInput);
    await auditLogsService.log(req, 'GALLERY_ITEM_CREATED', 'gallery_item', item.id, {});
    sendCreated(res, item, 'Gallery item created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const item = await galleryService.update(req.params.id!, req.body as UpdateGalleryItemInput);
    await auditLogsService.log(req, 'GALLERY_ITEM_UPDATED', 'gallery_item', item.id);
    sendSuccess(res, item, 'Gallery item updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await galleryService.remove(req.params.id!);
    await auditLogsService.log(req, 'GALLERY_ITEM_DELETED', 'gallery_item', req.params.id!);
    sendSuccess(res, null, 'Gallery item deleted.');
  },
};
