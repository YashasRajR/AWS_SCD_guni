import { useCallback, useEffect, useState } from 'react';
import { apiClient } from './api.js';
import { ApiClientError } from '@scd/api-client';

interface UseResourceResult<T> {
  /** The raw fetch result — a single object for endpoints like /volunteer/me. */
  data: T | null;
  /** For endpoints that return a bare array (checkpoints, history, search results) — [] until loaded. */
  items: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Fetches a volunteer-owned GET endpoint once, with a manual reload. */
export function useResource<T>(path: string, enabled = true): UseResourceResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get<T>(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiClientError ? err.message : 'Failed to load.');
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
    reload,
  };
}
