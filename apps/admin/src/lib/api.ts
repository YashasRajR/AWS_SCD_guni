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
  if (typeof window !== 'undefined') {
    try {
      // 1. Query parameter override: ?api=https://... or ?backend=https://...
      // Highest priority -- for pointing a live deploy at a different
      // backend without a rebuild (e.g. while debugging).
      const params = new URLSearchParams(window.location.search);
      const queryApi = params.get('api') || params.get('apiUrl') || params.get('backend');
      if (queryApi) {
        let clean = queryApi.trim().replace(/\/+$/, '');
        if (!clean.endsWith('/api/v1')) clean += '/api/v1';
        localStorage.setItem('VITE_API_URL', clean);
        return clean;
      }

      // 2. localStorage: whatever a previous ?api= override left behind.
      const stored = localStorage.getItem('VITE_API_URL');
      if (stored) return stored;
    } catch {
      // ignore
    }
  }

  // 3. VITE_API_URL set at build time -- the normal production path.
  // Trusted as-is (including the default Render name -- it's this
  // deploy's own backend unless the build was misconfigured).
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 4. No env var configured: guess the backend from this site's own
  // Render subdomain (e.g. scd-admin-abc1.onrender.com -> scd-backend-abc1).
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.onrender.com')) {
    const sub = window.location.hostname.split('.')[0] || '';
    const backendSub = sub.includes('admin') ? sub.replace('admin', 'backend') : sub.replace('web', 'backend');
    if (backendSub) return `https://${backendSub}.onrender.com/api/v1`;
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
