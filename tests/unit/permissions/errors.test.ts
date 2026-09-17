import { describe, expect, it } from 'vitest';
import { AppError } from '../../../backend/src/utils/errors.js';

describe('AppError', () => {
  it('maps AUTH_REQUIRED to 401', () => {
    expect(AppError.authRequired().status).toBe(401);
  });

  it('maps FORBIDDEN to 403', () => {
    expect(AppError.forbidden().status).toBe(403);
  });

  it('maps RESOURCE_NOT_FOUND to 404', () => {
    expect(AppError.notFound('Thing').status).toBe(404);
  });

  it('maps DUPLICATE_RESOURCE to 409', () => {
    expect(AppError.duplicate('dup').status).toBe(409);
  });

  it('carries the error code through to serialization call sites', () => {
    const err = AppError.validation('bad input', { field: 'email' });
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ field: 'email' });
  });
});
