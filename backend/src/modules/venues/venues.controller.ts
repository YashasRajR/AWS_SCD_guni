import type { Request, Response } from 'express';
import type { PaginationQuery } from '@scd/validation';
import type { CreateVenueInput, UpdateVenueInput } from '@scd/validation';
import { venuesService } from './venues.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const venuesController = {
  async list(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await venuesService.list());
  },

  /** Admin — GET /api/v1/admin/content/venues */
  async adminList(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    sendSuccess(res, await venuesService.adminList(page, pageSize));
  },

  async create(req: Request, res: Response): Promise<void> {
    const venue = await venuesService.create(req.body as CreateVenueInput);
    await auditLogsService.log(req, 'VENUE_CREATED', 'venue', venue.id, { name: venue.name });
    sendCreated(res, venue, 'Venue created.');
  },

  async update(req: Request, res: Response): Promise<void> {
    const venue = await venuesService.update(req.params.id!, req.body as UpdateVenueInput);
    await auditLogsService.log(req, 'VENUE_UPDATED', 'venue', venue.id);
    sendSuccess(res, venue, 'Venue updated.');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await venuesService.remove(req.params.id!);
    await auditLogsService.log(req, 'VENUE_DELETED', 'venue', req.params.id!);
    sendSuccess(res, null, 'Venue deleted.');
  },
};
