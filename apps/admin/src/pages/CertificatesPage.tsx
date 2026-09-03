import { useState } from 'react';
import type { Certificate } from '@scd/types';
import { usePaginatedResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { ApiClientError } from '@scd/api-client';
import { formatDateTime } from '../lib/format.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Modal } from '../components/Modal.js';
import { ResourceForm, type FieldDef, type FormValues } from '../components/ResourceForm.js';

const issueFields: FieldDef[] = [
  { name: 'attendeeId', label: 'Attendee ID (UUID)', type: 'text', required: true },
  { name: 'title', label: 'Certificate title', type: 'text', required: true },
  {
    name: 'certificateType',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'PARTICIPATION', label: 'Participation' },
      { value: 'SESSION', label: 'Session' },
      { value: 'ACHIEVEMENT', label: 'Achievement' },
    ],
  },
];

const columns: Column<Certificate>[] = [
  { key: 'certificateNumber', label: 'Certificate #', render: (r) => r.certificateNumber },
  { key: 'title', label: 'Title', render: (r) => r.title },
  { key: 'certificateType', label: 'Type', render: (r) => r.certificateType },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'issuedAt', label: 'Issued', render: (r) => formatDateTime(r.issuedAt) },
];

export function CertificatesPage() {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error, reload } = usePaginatedResource<Certificate>(
    '/admin/certificates',
    page,
  );
  const [showIssue, setShowIssue] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleIssue = async (values: FormValues) => {
    setIssueError(null);
    try {
      await apiClient.post('/admin/certificates', values);
      setShowIssue(false);
      reload();
    } catch (err) {
      setIssueError(err instanceof ApiClientError ? err.message : 'Failed to issue certificate.');
      throw err;
    }
  };

  const handleRevoke = async (cert: Certificate) => {
    if (!window.confirm(`Revoke certificate ${cert.certificateNumber}?`)) return;
    setRevokingId(cert.id);
    try {
      await apiClient.patch(`/admin/certificates/${cert.id}/revoke`, {});
      reload();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Failed to revoke.');
    } finally {
      setRevokingId(null);
    }
  };

  const columnsWithActions: Column<Certificate>[] = [
    ...columns,
    {
      key: '__actions',
      label: '',
      width: '100px',
      render: (row) => (
        <div className="row-actions">
          {row.status === 'ISSUED' && (
            <button
              type="button"
              className="btn-link btn-link-danger"
              disabled={revokingId === row.id}
              onClick={() => handleRevoke(row)}
            >
              {revokingId === row.id ? 'Revoking…' : 'Revoke'}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Certificates</h1>
          <p className="page-description">Issue and manage attendee certificates.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowIssue(true)}>
          + Issue certificate
        </button>
      </div>

      {issueError && <p className="form-error">{issueError}</p>}

      <Table columns={columnsWithActions} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />

      {showIssue && (
        <Modal title="Issue certificate" onClose={() => setShowIssue(false)}>
          <ResourceForm
            fields={issueFields}
            submitLabel="Issue"
            onSubmit={handleIssue}
            onCancel={() => setShowIssue(false)}
          />
        </Modal>
      )}
    </div>
  );
}
