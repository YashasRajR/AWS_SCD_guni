import { describe, expect, it } from 'vitest';
import { parseDurationMs } from '../../../backend/src/modules/auth/auth.ms.js';

describe('parseDurationMs', () => {
  it('parses minutes', () => {
    expect(parseDurationMs('15m')).toBe(15 * 60_000);
  });

  it('parses hours', () => {
    expect(parseDurationMs('1h')).toBe(3_600_000);
  });

  it('parses days', () => {
    expect(parseDurationMs('30d')).toBe(30 * 86_400_000);
  });

  it('rejects an invalid format', () => {
    expect(() => parseDurationMs('soon')).toThrow();
  });
});
