// Thin localStorage wrapper, isolated from AuthProvider so api.ts (which
// AuthProvider itself doesn't import, to avoid a cycle) can read the
// current token without importing React. Namespaced separately from the
// other two apps' storage keys so they can't collide.
const TOKEN_KEY = 'scd_web_token';
const REFRESH_TOKEN_KEY = 'scd_web_refresh_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable (private mode, disabled) — the session just
    // won't survive a reload; nothing else to do about it here.
  }
}

export function setStoredRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // ignore, same as setStoredToken above
  }
}

/** Name of the window event fired whenever the session is cleared (logout, or a 401 from the API). */
export const AUTH_CLEARED_EVENT = 'scd-web-auth-cleared';

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}
