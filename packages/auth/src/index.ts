// Shared, secret-free RBAC helpers. Real token issuance/verification
// (which needs AUTH_SECRET) lives in the backend only — never ship a
// signing secret to a browser bundle. This package only reasons about
// an already-authenticated identity the API has already told the client.
import type { AuthenticatedIdentity, RoleName } from '@scd/types';

export const AUTH_TOKEN_COOKIE = 'scd_token';
export const AUTH_HEADER = 'authorization';
export const AUTH_HEADER_SCHEME = 'Bearer';

export function hasRole(identity: AuthenticatedIdentity | null | undefined, role: RoleName): boolean {
  return Boolean(identity?.roles.includes(role));
}

export function hasAnyRole(
  identity: AuthenticatedIdentity | null | undefined,
  roles: RoleName[],
): boolean {
  return Boolean(identity && roles.some((r) => identity.roles.includes(r)));
}

export function hasPermission(
  identity: AuthenticatedIdentity | null | undefined,
  permission: string,
): boolean {
  return Boolean(identity?.permissions.includes(permission));
}

export function hasAllPermissions(
  identity: AuthenticatedIdentity | null | undefined,
  permissions: string[],
): boolean {
  return Boolean(identity && permissions.every((p) => identity.permissions.includes(p)));
}

/**
 * Reads the roles/permissions/expiry a login response's access token
 * carries, WITHOUT verifying its signature — this is for frontend UX only
 * (e.g. "hide the admin nav if this token has no ADMIN role", "log out
 * once it's expired"). The backend re-verifies the signature on every real
 * request via `AUTH_SECRET` (backend-only, never shipped to a browser
 * bundle) — nothing here is a security boundary, only a display/UX one.
 */
export function decodeAccessToken(token: string): AuthenticatedIdentity & { exp?: number } {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Not a valid JWT.');
  const payloadJson =
    typeof atob === 'function'
      ? atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/'))
      : ((globalThis as unknown as { Buffer: { from(data: string, encoding: string): { toString(enc: string): string } } })
          .Buffer.from(parts[1]!, 'base64')
          .toString('utf-8'));
  const payload = JSON.parse(payloadJson) as {
    sub: string;
    email: string;
    roles: RoleName[];
    permissions: string[];
    exp?: number;
  };
  return {
    userId: payload.sub,
    email: payload.email,
    roles: payload.roles,
    permissions: payload.permissions,
    exp: payload.exp,
  };
}

/** True once the token's `exp` claim (seconds since epoch) is in the past. Treats a token with no `exp` as not expired. */
export function isTokenExpired(decoded: { exp?: number }): boolean {
  return typeof decoded.exp === 'number' && decoded.exp * 1000 <= Date.now();
}
