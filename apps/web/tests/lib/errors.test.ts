import { describe, expect, it } from 'vitest';
import { ApiClientError, describeApiError } from '@scd/api-client';
import { statusTone } from '../../src/lib/format.js';

function errorWithStatus(status: number, message = 'server message'): ApiClientError {
  return new ApiClientError(status, { code: 'ERR', message });
}

describe('describeApiError', () => {
  it('gives a distinct, user-facing message per status code so a 403 never reads like a 500', () => {
    expect(describeApiError(errorWithStatus(401))).toMatch(/sign in again/i);
    expect(describeApiError(errorWithStatus(403))).toMatch(/permission/i);
    expect(describeApiError(errorWithStatus(404))).toMatch(/not found/i);
    expect(describeApiError(errorWithStatus(429))).toMatch(/too many requests/i);
  });

  it('keeps the server-supplied message for a 409 conflict, since those are already specific', () => {
    expect(describeApiError(errorWithStatus(409, 'This registration has already been paid for.'))).toBe(
      'This registration has already been paid for.',
    );
  });

  it('falls back to the raw message for any other status', () => {
    expect(describeApiError(errorWithStatus(500, 'boom'))).toBe('boom');
  });

  it('handles a non-ApiClientError (e.g. a network failure) without throwing', () => {
    expect(describeApiError(new TypeError('Failed to fetch'))).toMatch(/something went wrong/i);
  });
});

describe('statusTone', () => {
  it('maps every PaymentStatus to a tone, so a paid/failed payment never renders with the default neutral badge', () => {
    expect(statusTone('PAID')).toBe('success');
    expect(statusTone('PROCESSING')).toBe('warning');
    expect(statusTone('FAILED')).toBe('error');
    expect(statusTone('REFUNDED')).toBe('info');
  });
});
