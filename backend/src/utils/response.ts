import type { Response } from 'express';
import type { ApiErrorBody } from '@scd/types';

export function sendSuccess<T>(res: Response, data: T, message?: string, status = 200): Response {
  return res.status(status).json({ success: true, data, ...(message ? { message } : {}) });
}

export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendError(res: Response, status: number, error: ApiErrorBody): Response {
  return res.status(status).json({ success: false, error });
}
