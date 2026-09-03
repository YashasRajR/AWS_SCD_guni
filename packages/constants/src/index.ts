export * from './error-codes.js';
export * from './permissions.js';
export * from './seed-data.js';

export const API_VERSION_PREFIX = '/api/v1';

/**
 * Canonical event timezone. All timestamps are stored in Postgres as
 * TIMESTAMPTZ (i.e. UTC on disk) — this constant is the single place that
 * says which timezone "local" means for display/formatting purposes
 * (schedules, agenda, certificate dates, event-wrapped copy). Frontends
 * and any backend text rendering (emails, certificates) must format dates
 * with this timezone explicitly rather than relying on server/browser
 * local time, which is not guaranteed to be IST.
 */
export const EVENT_TIMEZONE = 'Asia/Kolkata';
