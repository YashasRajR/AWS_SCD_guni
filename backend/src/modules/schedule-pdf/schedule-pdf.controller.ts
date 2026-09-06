import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { schedulePdfService } from './schedule-pdf.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { AppError } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';

/** Same shape as uploads.controller.ts's multer wrapper, restricted to PDF
 * for the "replace manually" upload. */
const multerSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are allowed.'));
      return;
    }
    cb(null, true);
  },
}).single('file');

export function schedulePdfUploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  multerSingle(req, res, (err: unknown) => {
    if (err) {
      next(AppError.validation(err instanceof Error ? err.message : 'Invalid upload.'));
      return;
    }
    next();
  });
}

export const schedulePdfController = {
  /** Public status -- deliberately conservative: never reveals that an
   * unpublished PDF exists, only whether one is actually downloadable. */
  async getStatus(_req: Request, res: Response): Promise<void> {
    const status = await schedulePdfService.getStatus();
    sendSuccess(res, {
      pdfAvailable: status.pdfAvailable && status.published,
      isManual: status.isManual,
      published: status.published,
      generatedAt: status.published ? status.generatedAt : null,
      updatedAt: null,
    });
  },

  async downloadPublished(_req: Request, res: Response): Promise<void> {
    const pdf = await schedulePdfService.getPublishedPdf();
    res.type('application/pdf').send(pdf);
  },

  async adminGetStatus(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await schedulePdfService.getStatus());
  },

  async adminDownload(_req: Request, res: Response): Promise<void> {
    const pdf = await schedulePdfService.getPdf();
    res.type('application/pdf').send(pdf);
  },

  async generate(req: Request, res: Response): Promise<void> {
    const status = await schedulePdfService.generate();
    await auditLogsService.log(req, 'SCHEDULE_PDF_GENERATED', 'schedule_pdf', null, {});
    sendSuccess(res, status, 'Schedule PDF generated.');
  },

  async replace(req: Request, res: Response): Promise<void> {
    if (!req.file) throw AppError.validation('No file was uploaded.');
    const status = await schedulePdfService.replaceManually(req.file.buffer);
    await auditLogsService.log(req, 'SCHEDULE_PDF_REPLACED_MANUALLY', 'schedule_pdf', null, {});
    sendSuccess(res, status, 'Schedule PDF replaced.');
  },

  async publish(req: Request, res: Response): Promise<void> {
    const status = await schedulePdfService.setPublished(true);
    await auditLogsService.log(req, 'SCHEDULE_PDF_PUBLISHED', 'schedule_pdf', null, {});
    sendSuccess(res, status, 'Schedule PDF published.');
  },

  async unpublish(req: Request, res: Response): Promise<void> {
    const status = await schedulePdfService.setPublished(false);
    await auditLogsService.log(req, 'SCHEDULE_PDF_UNPUBLISHED', 'schedule_pdf', null, {});
    sendSuccess(res, status, 'Schedule PDF unpublished.');
  },
};
