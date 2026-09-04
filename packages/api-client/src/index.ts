import type { ApiErrorBody, ApiResponse } from '@scd/types';

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiClientError';
    this.code = body.code;
    this.status = status;
    this.details = body.details;
  }
}

/**
 * Maps a failed request to a status-appropriate, user-facing message.
 * Every app's list/error UI should call this instead of always falling
 * back to err.message, so a 403 doesn't read the same as a 500 (Phase 5
 * requires distinct per-status-code UX). 409 keeps the server's own
 * message since conflict errors are already written to be specific
 * ("This registration has already been paid for.", etc).
 */
export function describeApiError(err: unknown): string {
  if (err instanceof ApiClientError) {
    switch (err.status) {
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return "You don't have permission to do this.";
      case 404:
        return 'Not found.';
      case 409:
        return err.message;
      case 429:
        return 'Too many requests — please wait a moment and try again.';
      default:
        return err.message;
    }
  }
  return 'Something went wrong. Please try again.';
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns the current auth token (if any) at call time — never stored here. */
  getToken?: () => string | null | undefined;
  /**
   * Returns the current refresh token, if the app supports silent
   * refresh. Omit (along with onTokenRefreshed) to keep the old
   * behavior: a 401 goes straight to onUnauthorized.
   */
  getRefreshToken?: () => string | null | undefined;
  /** Called with a freshly rotated access+refresh token pair after a silent refresh succeeds — the app is responsible for persisting them. */
  onTokenRefreshed?: (accessToken: string, refreshToken: string) => void;
  /** Called whenever a response has success:false and status 401 and no refresh was possible/succeeded, e.g. to log the user out. */
  onUnauthorized?: () => void;
  /** Default request timeout in ms. */
  timeoutMs?: number;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

interface RefreshResponseData {
  accessToken: string;
  refreshToken: string;
}

/**
 * Minimal typed HTTP client for the SCD backend API. This layer only
 * knows how to make requests and unwrap the standard ApiResponse envelope —
 * it deliberately contains no business/domain logic.
 */
export class ApiClient {
  /** Shared in-flight refresh so N concurrent 401s trigger exactly one /auth/refresh call, not N. */
  private refreshPromise: Promise<string | null> | null = null;

  constructor(private readonly options: ApiClientOptions) {}

  private async attemptRefresh(): Promise<string | null> {
    const { getRefreshToken, onTokenRefreshed } = this.options;
    if (!getRefreshToken || !onTokenRefreshed) return null;
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const res = await fetch(buildUrl(this.options.baseUrl, '/auth/refresh'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const json = (await res.json().catch(() => null)) as ApiResponse<RefreshResponseData> | null;
          if (!json?.success) return null;
          onTokenRefreshed(json.data.accessToken, json.data.refreshToken);
          return json.data.accessToken;
        } catch {
          return null;
        }
      })();
    }
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    opts: RequestOptions = {},
    isRetry = false,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutMs = opts.timeoutMs ?? this.options.timeoutMs ?? 15000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const signal = opts.signal ?? controller.signal;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.options.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(buildUrl(this.options.baseUrl, path, opts.query), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });

      const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

      if (!json) {
        throw new ApiClientError(res.status, {
          code: 'INTERNAL_ERROR',
          message: `Unexpected non-JSON response (${res.status})`,
        });
      }

      if (!json.success) {
        if (res.status === 401 && !isRetry && path !== '/auth/refresh') {
          const newAccessToken = await this.attemptRefresh();
          if (newAccessToken) {
            return this.request<T>(method, path, body, opts, true);
          }
        }
        if (res.status === 401) this.options.onUnauthorized?.();
        throw new ApiClientError(res.status, json.error);
      }

      return json.data;
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, opts);
  }
  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, opts);
  }
  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, opts);
  }
  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, opts);
  }
  delete<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, opts);
  }
}
