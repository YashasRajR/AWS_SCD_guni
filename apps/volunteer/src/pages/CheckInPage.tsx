import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Checkpoint } from '@scd/types';
import { ApiClientError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';

interface AttendeeResult {
  id: string;
  fullName: string;
  university: string | null;
  registrationType: string | null;
}

type RowState = { status: 'idle' } | { status: 'submitting' } | { status: 'done' } | { status: 'error'; message: string };

export function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const { items: checkpoints } = useResource<Checkpoint>('/volunteer/checkpoints');
  const checkpoint = checkpoints.find((c) => c.id === id);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<AttendeeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError(null);
    apiClient
      .get<AttendeeResult[]>('/volunteer/attendees/search', { query: { q: debouncedQuery } })
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        if (!cancelled) setSearchError(err instanceof ApiClientError ? err.message : 'Search failed.');
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleComplete = async (attendeeId: string) => {
    if (!id) return;
    setRowStates((prev) => ({ ...prev, [attendeeId]: { status: 'submitting' } }));
    try {
      await apiClient.post('/volunteer/checkpoints/complete', { checkpointId: id, attendeeId });
      setRowStates((prev) => ({ ...prev, [attendeeId]: { status: 'done' } }));
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to complete checkpoint.';
      setRowStates((prev) => ({ ...prev, [attendeeId]: { status: 'error', message } }));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/" className="btn-link">
          ← Checkpoints
        </Link>
        <h1>{checkpoint?.name ?? 'Check in'}</h1>
      </div>

      <input
        type="search"
        className="search-input"
        placeholder="Search by name, email, or registration number"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {searching && <p className="status-line">Searching…</p>}
      {searchError && <p className="status-line status-error">{searchError}</p>}
      {!searching && debouncedQuery && results.length === 0 && !searchError && (
        <p className="status-line">No attendees found.</p>
      )}

      <ul className="attendee-result-list">
        {results.map((a) => {
          const rowState = rowStates[a.id] ?? { status: 'idle' };
          return (
            <li key={a.id} className="attendee-result">
              <div>
                <strong>{a.fullName}</strong>
                <p className="attendee-result-meta">
                  {a.university}
                  {a.university && a.registrationType ? ' · ' : ''}
                  {a.registrationType}
                </p>
                {rowState.status === 'error' && <p className="status-line status-error">{rowState.message}</p>}
              </div>
              {rowState.status === 'done' ? (
                <span className="badge badge-green">Checked in</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  disabled={rowState.status === 'submitting'}
                  onClick={() => handleComplete(a.id)}
                >
                  {rowState.status === 'submitting' ? '…' : 'Check in'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
