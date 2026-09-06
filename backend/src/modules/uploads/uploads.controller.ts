import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { getEnv } from '../../config/env.js';
import { uploadsService } from './uploads.service.js';
import { AppError } from '../../utils/errors.js';
import { sendCreated } from '../../utils/response.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/** Memory storage: files are small (image-sized, capped below) and go
 * straight to the storage provider, so there's no need to touch disk twice. */
const multerSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getEnv().UPLOAD_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed.'));
      return;
    }
    cb(null, true);
  },
}).single('file');

/** Wraps multer so a bad upload (wrong type, too large) reaches the client
 * as a normal 400 validation error instead of a generic 500 -- multer
 * reports these via a plain Error passed to its own callback, not by
 * throwing, so asyncHandler alone wouldn't catch or reclassify it. */
export function uploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  multerSingle(req, res, (err: unknown) => {
    if (err) {
      next(AppError.validation(err instanceof Error ? err.message : 'Invalid upload.'));
      return;
    }
    next();
  });
}

export const uploadsController = {
  /** Generic image upload used by every admin content form's image field
   * (speaker photos today; any future gallery/hero/logo field reuses this
   * same endpoint rather than growing a bespoke one per module). */
  async upload(req: Request, res: Response): Promise<void> {
    if (!req.file) throw AppError.validation('No file was uploaded.');
    const { url } = await uploadsService.storeImage(req.file);
    sendCreated(res, { url }, 'File uploaded.');
  },
};
