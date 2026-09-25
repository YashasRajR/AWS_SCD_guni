import { ApiClient } from '@scd/api-client';
import {
  getStoredToken,
  getStoredRefreshToken,
  setStoredToken,
  setStoredRefreshToken,
  clearStoredSession,
} from './auth-storage.js';

/**
 * A single shared ApiClient instance for the whole app. `getToken` is read
 * fresh on every request (never cached here) so a token set/cleared by
 * AuthProvider is picked up immediately; `onUnauthorized` clears the
 * stored session so a 401 (expired/garbage token) drops the app back to
 * the login screen on the next render rather than looping failed requests.
 */
function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const stored = localStorage.getItem('VITE_API_URL');
    if (stored) return stored;

    if (window.location.hostname.endsWith('.onrender.com')) {
      const parts = window.location.hostname.split('.');
      const sub = parts[0] || '';
      const backendSub = sub.replace(/^scd-(web|admin)/, 'scd-backend');
      return `https://${backendSub}.onrender.com/api/v1`;
    }
  }

  return envUrl ?? 'http://localhost:4000/api/v1';
}

export const apiClient = new ApiClient({
  baseUrl: resolveApiBaseUrl(),
  getToken: () => getStoredToken(),
  getRefreshToken: () => getStoredRefreshToken(),
  // A silent refresh succeeded — persist the rotated pair. No React
  // state update is triggered here (api.ts intentionally doesn't import
  // AuthProvider, to avoid a cycle); the decoded identity in memory
  // stays as-is until next reload, which is fine since a refresh only
  // changes roles/permissions in the rare case an admin edited them
  // mid-session.
  onTokenRefreshed: (accessToken, refreshToken) => {
    setStoredToken(accessToken);
    setStoredRefreshToken(refreshToken);
  },
  onUnauthorized: () => clearStoredSession(),
});
