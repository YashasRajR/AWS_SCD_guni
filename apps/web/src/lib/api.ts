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
 * stored session so a 401 (expired/garbage token) drops the app back to a
 * signed-out state on the next render rather than looping failed requests.
 */
function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    try {
      // 1. Query parameter override: ?api=https://... or ?backend=https://...
      const params = new URLSearchParams(window.location.search);
      const queryApi = params.get('api') || params.get('apiUrl') || params.get('backend');
      if (queryApi) {
        let clean = queryApi.trim().replace(/\/+$/, '');
        if (!clean.endsWith('/api/v1')) clean += '/api/v1';
        localStorage.setItem('VITE_API_URL', clean);
        return clean;
      }

      // 2. localStorage saved API URL
      const stored = localStorage.getItem('VITE_API_URL');
      if (stored && !stored.includes('://scd-backend.onrender.com')) {
        return stored;
      }

      // 3. Dynamic Render subdomain pairing:
      // If web is at scd-web-abc1.onrender.com, pair with scd-backend-abc1.onrender.com
      if (window.location.hostname.endsWith('.onrender.com')) {
        const parts = window.location.hostname.split('.');
        const sub = parts[0] || '';
        const backendSub = sub.includes('web')
          ? sub.replace('web', 'backend')
          : sub.replace('admin', 'backend');

        if (backendSub && backendSub !== 'scd-backend') {
          return `https://${backendSub}.onrender.com/api/v1`;
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Environment variable, rejecting the external taken domain
  const envUrl = import.meta.env.VITE_API_URL;
  if (
    envUrl &&
    !envUrl.includes('localhost') &&
    !envUrl.includes('127.0.0.1') &&
    !envUrl.includes('://scd-backend.onrender.com')
  ) {
    return envUrl;
  }

  return 'http://localhost:4000/api/v1';
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
