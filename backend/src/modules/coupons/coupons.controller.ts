import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateCouponInput, UpdateCouponInput } from '@scd/validation';
import { couponsService } from './coupons.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const couponsController = {
  /** Admin -- GET /api/v1/admin/content/coupons. No public list endpoint --
   * coupons are validated one at a time via /me/coupons/preview. */
  async adminList(req: Request, res: Response): Promise<void> {
    const params = req.query as unknown as PaginationQuery;
    sendSuccess(res, await couponsService.adminList(params));
  },

  async create(req: Request, res: Response): Promise<void> {
    const coupon = await couponsService.create(req.body as CreateCouponInput);
    await auditLogsService.log(req, 'COUPON_CREATED', 'coupon', coupon.id, { code: coupon.code });
    sendCreated(res, coupon, 'Coupon created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const coupon = await couponsService.update(req.params.id!, req.body as UpdateCouponInput);
    await auditLogsService.log(req, 'COUPON_UPDATED', 'coupon', coupon.id);
    sendSuccess(res, coupon, 'Coupon updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await couponsService.remove(req.params.id!);
    await auditLogsService.log(req, 'COUPON_DELETED', 'coupon', req.params.id!);
    sendSuccess(res, null, 'Coupon deleted.');
  },
};
