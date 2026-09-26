import { useRef, useState } from 'react';
import type { SchedulePdfStatus } from '@scd/types';
import { describeApiError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient, resolveApiBaseUrl } from '../lib/api.js';
import { getStoredToken } from '../lib/auth-storage.js';
import { formatDateTime } from '../lib/format.js';

const baseUrl = () => (resolveApiBaseUrl()).replace(/\/$/, '');

async function downloadAdminPdf(): Promise<void> {
  const res = await fetch(`${baseUrl()}/admin/schedule-pdf/pdf`, {
    headers: { Authorization: `Bearer ${getStoredToken() ?? ''}` },
  });
  if (!res.ok) throw new Error('Failed to download PDF.');
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = 'event-schedule.pdf';
  link.click();
  URL.revokeObjectURL(url);
}

/** Admin control panel for the downloadable schedule PDF (spec #12):
 * generate from the live agenda/session/venue data, publish/unpublish,
 * preview/download, or replace with a hand-built file. */
export function SchedulePdfPage() {
  const { data: status, loading, error, reload } = useResource<SchedulePdfStatus>('/admin/schedule-pdf');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      reload();
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setActionError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${baseUrl()}/admin/schedule-pdf/replace`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getStoredToken() ?? ''}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload PDF.');
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to upload PDF.');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Event schedule PDF</h1>
          <p className="page-description">
            Generated from the live agenda, sessions, and venues — never a separately hand-maintained schedule.
          </p>
        </div>
      </div>

      {loading && <p className="status-line">Loading…</p>}
      {error && <p className="form-error">{error}</p>}
      {actionError && <p className="form-error">{actionError}</p>}

      {status && (
        <div className="dashboard-card">
          <p className="dashboard-card-row">
            <span className={`status-dot status-dot-${status.pdfAvailable ? 'ok' : 'error'}`} aria-hidden="true" />
            {status.pdfAvailable ? (status.isManual ? 'Manually replaced file' : 'Generated file') : 'No file yet'}
          </p>
          {status.generatedAt && <p className="status-line">Generated {formatDateTime(status.generatedAt)}.</p>}
          <p className="status-line">
            {status.published ? 'Published — visible on the public site.' : 'Not published — hidden from the public site.'}
          </p>

          <div className="form-actions">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run(() => apiClient.post('/admin/schedule-pdf/generate'))}>
              {status.pdfAvailable ? 'Regenerate' : 'Generate'}
            </button>
            <button type="button" className="btn btn-secondary" disabled={busy || !status.pdfAvailable} onClick={() => downloadAdminPdf().catch((err) => setActionError(err.message))}>
              Preview / Download
            </button>
            {status.published ? (
              <button type="button" className="btn-link" disabled={busy} onClick={() => run(() => apiClient.post('/admin/schedule-pdf/unpublish'))}>
                Unpublish
              </button>
            ) : (
              <button type="button" className="btn-link" disabled={busy || !status.pdfAvailable} onClick={() => run(() => apiClient.post('/admin/schedule-pdf/publish'))}>
                Publish
              </button>
            )}
            <label className="btn-link" style={{ cursor: 'pointer' }}>
              Replace manually…
              <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleReplace} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
