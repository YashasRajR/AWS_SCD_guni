import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Checkpoint } from '@scd/types';
import { ApiClientError, describeApiError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { QrScanner } from '../components/QrScanner.js';

interface AttendeeResult {
  id: string;
  fullName: string;
  university: string | null;
  registrationType: string | null;
}

type RowState = { status: 'idle' } | { status: 'submitting' } | { status: 'done' } | { status: 'error'; message: string };

/** How long a scan result banner stays up before the camera resumes reading. */
const SCAN_COOLDOWN_MS = 2000;

export function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const { items: checkpoints } = useResource<Checkpoint>('/volunteer/checkpoints');
  const checkpoint = checkpoints.find((c) => c.id === id);

  const [mode, setMode] = useState<'scan' | 'search'>('scan');

  // --- QR scan mode ---------------------------------------------------
  const [scanBusy, setScanBusy] = useState(false);
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [cameraFallback, setCameraFallback] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const handleScan = async (qrToken: string) => {
    if (!id || scanBusy) return;
    setScanBusy(true);
    setScanResult(null);
    try {
      await apiClient.post('/volunteer/checkpoints/complete', { checkpointId: id, qrToken });
      setScanResult({ status: 'success', message: 'Checked in.' });
    } catch (err) {
      setScanResult({ status: 'error', message: describeApiError(err) });
    } finally {
      cooldownTimer.current = setTimeout(() => {
        setScanBusy(false);
        setScanResult(null);
      }, SCAN_COOLDOWN_MS);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = manualToken.trim();
    if (!token) return;
    setManualToken('');
    void handleScan(token);
  };

  // --- Search mode (fallback for a lost/undisplayable QR code) --------
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
    if (mode !== 'search' || !debouncedQuery) {
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
  }, [mode, debouncedQuery]);

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

      <div className="mode-toggle" role="tablist" aria-label="Check-in method">
        <button
          type="button"
          role="tab"
          id="scan-tab"
          aria-selected={mode === 'scan'}
          aria-controls="scan-panel"
          className={`mode-toggle-tab${mode === 'scan' ? ' mode-toggle-active' : ''}`}
          onClick={() => setMode('scan')}
        >
          Scan QR
        </button>
        <button
          type="button"
          role="tab"
          id="search-tab"
          aria-selected={mode === 'search'}
          aria-controls="search-panel"
          className={`mode-toggle-tab${mode === 'search' ? ' mode-toggle-active' : ''}`}
          onClick={() => setMode('search')}
        >
          Search instead
        </button>
      </div>

      {mode === 'scan' && (
        <div id="scan-panel" role="tabpanel" aria-labelledby="scan-tab">
          <QrScanner
            onDetect={(value) => void handleScan(value)}
            paused={scanBusy}
            onStateChange={(state, message) => setCameraFallback(state === 'active' ? null : (message ?? null))}
          />

          {scanResult && (
            <p className={`scan-banner ${scanResult.status === 'success' ? 'scan-banner-success' : 'scan-banner-error'}`}>
              {scanResult.message}
            </p>
          )}

          {cameraFallback && (
            <div className="qr-fallback">
              <p className="status-line">{cameraFallback}</p>
              <form className="qr-fallback-form" onSubmit={handleManualSubmit}>
                <label htmlFor="manual-token" className="visually-hidden">
                  Ticket token
                </label>
                <input
                  id="manual-token"
                  type="text"
                  className="search-input"
                  placeholder="Paste or type the ticket token"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  disabled={scanBusy}
                />
                <button type="submit" className="btn btn-primary btn-block" disabled={scanBusy || !manualToken.trim()}>
                  {scanBusy ? '…' : 'Check in'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {mode === 'search' && (
        <div id="search-panel" role="tabpanel" aria-labelledby="search-tab">
          <label htmlFor="attendee-search" className="visually-hidden">
            Search attendees by name, email, or registration number
          </label>
          <input
            id="attendee-search"
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
      )}
    </div>
  );
}
