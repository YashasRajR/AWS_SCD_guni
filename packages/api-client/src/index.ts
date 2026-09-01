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

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns the current auth token (if any) at call time — never stored here. */
  getToken?: () => string | null | undefined;
  /** Called whenever a response has success:false and status 401, e.g. to log the user out. */
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

/**
 * Minimal typed HTTP client for the SCD backend API. This layer only
 * knows how to make requests and unwrap the standard ApiResponse envelope —
 * it deliberately contains no business/domain logic.
 */
export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    opts: RequestOptions = {},
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
