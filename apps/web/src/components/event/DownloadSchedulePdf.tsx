import { useState } from 'react';
import type { SchedulePdfStatus } from '@scd/types';
import { useResource } from '../../lib/hooks.js';

const baseUrl = () => (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');

async function downloadPublishedPdf(): Promise<void> {
  const res = await fetch(`${baseUrl()}/schedule-pdf/download`);
  if (!res.ok) throw new Error('Schedule PDF is not available yet.');
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = 'event-schedule.pdf';
  link.click();
  URL.revokeObjectURL(url);
}

/** "Download Event Schedule PDF" (spec #12) -- only rendered once a
 * published PDF actually exists, so there's never a dead/broken button. */
export function DownloadSchedulePdf() {
  const { data: status } = useResource<SchedulePdfStatus>('/schedule-pdf');
  const [error, setError] = useState<string | null>(null);

  if (!status?.pdfAvailable) return null;

  return (
    <div className="dashboard-card-row">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => downloadPublishedPdf().catch((err) => setError(err.message))}
      >
        Download event schedule PDF
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
