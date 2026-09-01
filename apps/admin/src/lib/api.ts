import { ApiClient } from '@scd/api-client';
import { getStoredToken, clearStoredSession } from './auth-storage.js';

/**
 * A single shared ApiClient instance for the whole app. `getToken` is read
 * fresh on every request (never cached here) so a token set/cleared by
 * AuthProvider is picked up immediately; `onUnauthorized` clears the
 * stored session so a 401 (expired/garbage token) drops the app back to
 * the login screen on the next render rather than looping failed requests.
 */
export const apiClient = new ApiClient({
  // Every admin route lives under /api/v1 (see backend/src/server/app.ts) —
  // unlike the web/volunteer placeholder apps, nothing here calls the
  // unprefixed /health endpoint, so the default baseUrl includes the prefix.
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1',
  getToken: () => getStoredToken(),
  onUnauthorized: () => clearStoredSession(),
});
