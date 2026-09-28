import { Router } from 'express';
import { getPool } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Public GET for files stored by uploads.service.ts (see
 * integrations/storage/db-storage.ts). Replaces express.static once
 * uploads moved from local disk into Postgres -- same public, unauthenticated,
 * URL shape (/uploads/<key>) so no caller (frontend, stored DB URLs) changes.
 */
export const uploadsServeRouter = Router();

uploadsServeRouter.get(
  '/*',
  asyncHandler(async (req, res) => {
    const key = req.params[0];
    const result = await getPool().query<{ content_type: string; data: Buffer }>(
      'SELECT content_type, data FROM uploaded_files WHERE key = $1',
      [key],
    );
    const row = result.rows[0];
    if (!row) {
      res.sendStatus(404);
      return;
    }
    const { content_type: contentType, data } = row;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(data);
  }),
);
