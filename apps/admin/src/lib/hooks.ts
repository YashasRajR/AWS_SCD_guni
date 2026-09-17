import { useCallback, useEffect, useState } from 'react';
import type { EventConfig, PaginatedData } from '@scd/types';
import { apiClient } from './api.js';
import { describeApiError } from '@scd/api-client';

interface UsePaginatedResourceResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export interface ListQuery {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** Only consulted by endpoints that accept it (attendees, so far) --
   * ignored otherwise like the rest of ListQuery. */
  archived?: boolean;
  /** Only consulted by endpoints that accept it (payments, so far). */
  status?: string;
}

/** Fetches a PaginatedData<T> admin list endpoint, refetching whenever
 * `path`, `page`, `query` (search/sort), or `reloadToken` change. Every
 * admin content-management list endpoint accepts `search`/`sortBy`/
 * `sortOrder` — see backend/src/utils/sql.ts's paginatedListQuery — an
 * endpoint that ignores them (or a caller that omits `query`) behaves
 * exactly as before. */
export function usePaginatedResource<T>(
  path: string,
  page: number,
  pageSize = 20,
  query: ListQuery = {},
): UsePaginatedResourceResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const { search, sortBy, sortOrder, archived, status } = query;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get<PaginatedData<T>>(path, { query: { page, pageSize, search, sortBy, sortOrder, archived, status } })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotalItems(data.pagination.totalItems);
        setTotalPages(data.pagination.totalPages);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(describeApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, page, pageSize, search, sortBy, sortOrder, archived, status, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return { items, totalItems, totalPages, loading, error, reload };
}

/** Fetches a plain (non-paginated) admin/public array or object endpoint once, with a manual reload. */
export function useResource<T>(path: string, enabled = true): UsePaginatedResourceResult<T> & { data: T | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get<T>(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(describeApiError(err));
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
    items: Array.isArray(data) ? (data as T[]) : [],
    totalItems: 0,
    totalPages: 1,
    loading,
    error,
    reload,
  };
}

/**
 * The event id needed by venues/agenda/timeline create forms.
 * Uses the public /event read (always the current PUBLISHED event) —
 * every domain that needs an eventId is scoped to the one currently-live
 * event, matching this platform's single-edition scope this phase.
 */
export function useCurrentEventId(): string | null {
  const [eventId, setEventId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<EventConfig>('/event')
      .then((event) => {
        if (!cancelled) setEventId(event.id);
      })
      .catch(() => {
        // No PUBLISHED event yet — create forms that need it will just
        // omit eventId until the admin publishes one on the Event page.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return eventId;
}

/**
 * Debounces a search box into a query-ready value, and resets to page 1
 * whenever it changes (a stale page number could otherwise land past the
 * end of the filtered result set). Mirrors the inline pattern in
 * ContentCrudPage.tsx, shared here for the plain list pages that added
 * search support without the full create/edit/delete CRUD scaffold.
 */
export function useDebouncedSearch(
  setPage: (page: number) => void,
  initial = '',
  delayMs = 300,
): {
  searchInput: string;
  setSearchInput: (value: string) => void;
  search: string;
} {
  const [searchInput, setSearchInput] = useState(initial);
  const [search, setSearch] = useState(initial);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, delayMs);
    return () => clearTimeout(handle);
  }, [searchInput, delayMs, setPage]);

  return { searchInput, setSearchInput, search };
}
