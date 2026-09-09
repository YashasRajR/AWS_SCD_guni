import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Attendee } from '@scd/types';
import { usePaginatedResource, useDebouncedSearch } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { downloadFile } from '../lib/download.js';

export function AttendeesPage() {
  const [urlParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [archived, setArchived] = useState(false);
  const { searchInput, setSearchInput, search } = useDebouncedSearch(setPage, urlParams.get('search') ?? '');
  const { items, totalItems, totalPages, loading, error } = usePaginatedResource<Attendee>(
    '/admin/attendees',
    page,
    20,
    { search: search || undefined, archived },
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await downloadFile('/admin/attendees/export', 'attendees.csv');
    } catch {
      setExportError('Failed to download export.');
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<Attendee>[] = [
    {
      key: 'fullName',
      label: 'Name',
      render: (r) => <Link to={`/attendees/${r.id}`}>{r.fullName}</Link>,
    },
    { key: 'university', label: 'University', render: (r) => r.university ?? '—' },
    { key: 'department', label: 'Department', render: (r) => r.department ?? '—' },
    { key: 'year', label: 'Year', render: (r) => r.year ?? '—' },
    { key: 'registrationType', label: 'Type', render: (r) => r.registrationType ?? '—' },
    { key: 'createdAt', label: 'Registered', render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attendees</h1>
          <p className="page-description">
            Profiles are created through registration — open one to edit details, correct check-ins,
            or archive/restore it.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {exportError && <p className="form-error">{exportError}</p>}

      <div className="page-toolbar">
        <input
          type="search"
          className="input search-input"
          placeholder="Search by name, email, or registration #…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => {
              setArchived(e.target.checked);
              setPage(1);
            }}
          />
          Show archived
        </label>
      </div>

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
