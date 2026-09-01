// Thin localStorage wrapper, isolated from AuthProvider so api.ts (which
// AuthProvider itself doesn't import, to avoid a cycle) can read the
// current token without importing React. Namespaced separately from the
// admin app's storage key so the two can't collide if ever opened side by
// side in a browser that shares storage (they're different origins/ports
// today, but this is free insurance).
const TOKEN_KEY = 'scd_web_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
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

/** Name of the window event fired whenever the session is cleared (logout, or a 401 from the API). */
export const AUTH_CLEARED_EVENT = 'scd-web-auth-cleared';

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}
