import { useCallback, useEffect, useState } from 'react';
import { apiClient } from './api.js';
import { ApiClientError } from '@scd/api-client';

interface UseResourceResult<T> {
  /** The raw fetch result — a single object for endpoints like /event or /me/ticket. */
  data: T | null;
  /** For endpoints that return a bare array (every public content list) — [] until loaded. */
  items: T[];
  loading: boolean;
  /** null on a 404 (treated as "nothing published yet", not an error) — set for every other failure. */
  error: string | null;
  notFound: boolean;
  reload: () => void;
}

/**
 * Fetches a public (or, when `enabled` gates it, attendee-owned) GET
 * endpoint once, with a manual reload. Public content endpoints return
 * bare arrays, not the paginated envelope the admin app's endpoints use —
 * `items` unwraps that case directly; for a single-object endpoint (like
 * /event) use `data` instead.
 */
export function useResource<T>(path: string, enabled = true): UseResourceResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    apiClient
      .get<T>(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setNotFound(true);
          setData(null);
        } else {
          setError(err instanceof ApiClientError ? err.message : 'Failed to load.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, enabled, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return {
    data,
    items: (Array.isArray(data) ? data : []) as UseResourceResult<T>['items'],
    loading,
    error,
    notFound,
    reload,
  };
}
