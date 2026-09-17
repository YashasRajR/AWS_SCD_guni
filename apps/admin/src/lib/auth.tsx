import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PublicUser } from '@scd/types';
import { decodeAccessToken, isTokenExpired, hasAnyRole } from '@scd/auth';
import type { AuthenticatedIdentity } from '@scd/types';
import { apiClient } from './api.js';
import {
  getStoredToken,
  getStoredRefreshToken,
  setStoredToken,
  setStoredRefreshToken,
  clearStoredSession,
  AUTH_CLEARED_EVENT,
} from './auth-storage.js';
import { ApiClientError } from '@scd/api-client';

interface LoginResponseData {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface AuthContextValue {
  /** null while the initial token check is running, so the app doesn't flash the login screen first. */
  status: 'checking' | 'signed-out' | 'signed-in';
  identity: AuthenticatedIdentity | null;
  user: PublicUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Roles allowed into the admin panel. SUPER_ADMIN/ADMIN have full access;
// the others are permission-scoped (spec #43) but still sign in here —
// route/action visibility narrows per-permission via hasPermission().
const ADMIN_PANEL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'FINANCE_ADMIN',
  'CONTENT_ADMIN',
] as const;

/** Decodes+validates a stored token, returning the identity only if it's a non-expired admin-panel token. */
function loadAdminIdentity(token: string | null): AuthenticatedIdentity | null {
  if (!token) return null;
  try {
    const decoded = decodeAccessToken(token);
    if (isTokenExpired(decoded)) return null;
    if (!hasAnyRole(decoded, [...ADMIN_PANEL_ROLES])) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue['status']>('checking');
  const [identity, setIdentity] = useState<AuthenticatedIdentity | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const loaded = loadAdminIdentity(token);
    if (loaded) {
      setIdentity(loaded);
      setStatus('signed-in');
    } else {
      clearStoredSession();
      setStatus('signed-out');
    }
  }, []);

  const logout = useCallback(async () => {
    // Best-effort: revoke the refresh token server-side so it can't be
    // silently reused, but never let a network failure block signing out
    // locally — clearStoredSession (below) always runs regardless.
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        // ignore — local sign-out proceeds either way
      }
    }
    // clearStoredSession fires AUTH_CLEARED_EVENT, which the listener
    // below picks up to reset identity/user/status — one code path for
    // both an explicit logout and an API-driven 401.
    clearStoredSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    let result: LoginResponseData;
    try {
      result = await apiClient.post<LoginResponseData>('/auth/login', { email, password });
    } catch (err) {
      if (err instanceof ApiClientError) throw new Error(err.message);
      throw err;
    }
    const decoded = loadAdminIdentity(result.accessToken);
    if (!decoded) {
      throw new Error('This account does not have admin access.');
    }
    setStoredToken(result.accessToken);
    setStoredRefreshToken(result.refreshToken);
    setIdentity(decoded);
    setUser(result.user);
    setStatus('signed-in');
  }, []);

  // If the API client ever gets a 401 (expired/garbage token), it clears
  // storage and fires this event — drop straight back to signed-out
  // instead of silently keeping stale "signed-in" state around.
  useEffect(() => {
    const onCleared = () => {
      setIdentity(null);
      setUser(null);
      setStatus('signed-out');
    };
    window.addEventListener(AUTH_CLEARED_EVENT, onCleared);
    return () => window.removeEventListener(AUTH_CLEARED_EVENT, onCleared);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, identity, user, login, logout }),
    [status, identity, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
