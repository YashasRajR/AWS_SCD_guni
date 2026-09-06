import type { Request, Response } from 'express';
import { searchService } from './search.service.js';
import { sendSuccess } from '../../utils/response.js';

export const searchController = {
  async search(req: Request, res: Response): Promise<void> {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await searchService.search(query, req.identity?.permissions ?? []);
    sendSuccess(res, { results });
  },
};
