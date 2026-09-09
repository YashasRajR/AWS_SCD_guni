import type { Checkpoint } from '@scd/types';
import { useState } from 'react';
import { downloadFile } from '../lib/download.js';
import { ContentCrudPage } from '../components/ContentCrudPage.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { useCurrentEventId } from '../lib/hooks.js';
import type { Column } from '../components/Table.js';
import type { FieldDef } from '../components/ResourceForm.js';

const columns: Column<Checkpoint>[] = [
  { key: 'name', label: 'Name', render: (r) => r.name },
  { key: 'location', label: 'Location', render: (r) => r.location ?? '—' },
  { key: 'isRequired', label: 'Required', render: (r) => (r.isRequired ? 'Yes' : 'No') },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FieldDef[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'location', label: 'Location', type: 'text' },
  { name: 'startTime', label: 'Start time', type: 'datetime' },
  { name: 'endTime', label: 'End time', type: 'datetime' },
  { name: 'displayOrder', label: 'Display order', type: 'number' },
  { name: 'isRequired', label: 'Required for full attendance', type: 'checkbox' },
];

export function CheckpointsPage() {
  const eventId = useCurrentEventId();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadFile('/admin/checkpoints/attendance/export', 'checkpoint-attendance.csv');
    } catch {
      // Toolbar button has no error slot — a failed download is silently retryable.
    } finally {
      setExporting(false);
    }
  };

  return (
    <ContentCrudPage<Checkpoint>
      title="Checkpoints"
      description="Volunteers can only complete checkpoints they're assigned to (see Volunteers)."
      basePath="/admin/checkpoints"
      columns={columns}
      fields={fields}
      rowToFormValues={(row) => ({ ...row })}
      createExtraValues={eventId ? { eventId } : undefined}
      extraToolbar={
        <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export attendance CSV'}
        </button>
      }
    />
  );
}
