// Thin localStorage wrapper, isolated from AuthProvider so api.ts (which
// AuthProvider itself doesn't import, to avoid a cycle) can read the
// current token without importing React.
const TOKEN_KEY = 'scd_admin_token';

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
export const AUTH_CLEARED_EVENT = 'scd-admin-auth-cleared';

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}
