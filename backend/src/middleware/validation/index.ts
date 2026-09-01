import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../../utils/errors.js';

type Source = 'body' | 'query' | 'params';

/**
 * Validates `req[source]` against a zod schema and REPLACES it with the
 * parsed (and coerced/defaulted) value. Every external input must go
 * through this — controllers never trust raw req.body/query/params.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw AppError.validation('Request validation failed.', {
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[source] = result.data;
    next();
  };
}
