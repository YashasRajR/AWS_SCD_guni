import { useState } from 'react';
import type { Checkpoint, Volunteer } from '@scd/types';
import { usePaginatedResource, useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { ApiClientError } from '@scd/api-client';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Modal } from '../components/Modal.js';
import { ResourceForm, type FieldDef, type FormValues } from '../components/ResourceForm.js';

const createFields: FieldDef[] = [
  {
    name: 'email',
    label: 'Email of an already-registered account',
    type: 'text',
    required: true,
    help: 'The person must have signed up on the public site first.',
  },
  { name: 'name', label: 'Display name', type: 'text', required: true },
  { name: 'phone', label: 'Phone', type: 'text' },
];

const editFields: FieldDef[] = [
  { name: 'name', label: 'Display name', type: 'text' },
  { name: 'phone', label: 'Phone', type: 'text' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
    ],
  },
];

function CheckpointAssignmentModal({ volunteer, onClose }: { volunteer: Volunteer; onClose: () => void }) {
  const { items: allCheckpoints } = usePaginatedResource<Checkpoint>('/admin/checkpoints', 1, 100);
  const {
    data: assigned,
    loading,
    reload,
  } = useResource<Checkpoint[]>(`/admin/volunteers/${volunteer.id}/checkpoints`);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assignedIds = new Set((assigned ?? []).map((c) => c.id));

  const toggle = async (checkpoint: Checkpoint, shouldAssign: boolean) => {
    setBusyId(checkpoint.id);
    setError(null);
    try {
      if (shouldAssign) {
        await apiClient.post(`/admin/volunteers/${volunteer.id}/checkpoints`, { checkpointId: checkpoint.id });
      } else {
        await apiClient.delete(`/admin/volunteers/${volunteer.id}/checkpoints/${checkpoint.id}`);
      }
      reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update assignment.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal title={`Checkpoints for ${volunteer.name}`} onClose={onClose}>
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : allCheckpoints.length === 0 ? (
        <p className="form-help">No checkpoints exist yet — create one on the Checkpoints page first.</p>
      ) : (
        <div className="multiselect">
          {allCheckpoints.map((cp) => (
            <label className="multiselect-option" key={cp.id}>
              <input
                type="checkbox"
                checked={assignedIds.has(cp.id)}
                disabled={busyId === cp.id}
                onChange={(e) => toggle(cp, e.target.checked)}
              />
              {cp.name}
            </label>
          ))}
        </div>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

export function VolunteersPage() {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error, reload } = usePaginatedResource<Volunteer>(
    '/admin/volunteers',
    page,
  );
  const [modal, setModal] = useState<
    { mode: 'create' } | { mode: 'edit'; row: Volunteer } | { mode: 'checkpoints'; row: Volunteer } | null
  >(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async (values: FormValues) => {
    try {
      await apiClient.post('/admin/volunteers', values);
      setModal(null);
      setCreateError(null);
      reload();
    } catch (err) {
      setCreateError(err instanceof ApiClientError ? err.message : 'Failed to create volunteer.');
      throw err;
    }
  };

  const handleUpdate = async (id: string, values: FormValues) => {
    await apiClient.patch(`/admin/volunteers/${id}`, values);
    setModal(null);
    reload();
  };

  const columns: Column<Volunteer>[] = [
    { key: 'name', label: 'Name', render: (r) => r.name },
    { key: 'phone', label: 'Phone', render: (r) => r.phone ?? '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: '__actions',
      label: '',
      width: '260px',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn-link" onClick={() => setModal({ mode: 'edit', row })}>
            Edit
          </button>
          <button type="button" className="btn-link" onClick={() => setModal({ mode: 'checkpoints', row })}>
            Manage checkpoints
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Volunteers</h1>
          <p className="page-description">
            Promoting someone to volunteer requires their account to already exist — they must register first.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}>
          + Promote to volunteer
        </button>
      </div>

      {createError && modal?.mode !== 'create' && <p className="form-error">{createError}</p>}

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />

      {modal?.mode === 'create' && (
        <Modal title="Promote to volunteer" onClose={() => setModal(null)}>
          <ResourceForm fields={createFields} submitLabel="Promote" onSubmit={handleCreate} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.mode === 'edit' && (
        <Modal title={`Edit ${modal.row.name}`} onClose={() => setModal(null)}>
          <ResourceForm
            fields={editFields}
            initialValues={{ ...modal.row }}
            submitLabel="Save changes"
            onSubmit={(values) => handleUpdate(modal.row.id, values)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.mode === 'checkpoints' && <CheckpointAssignmentModal volunteer={modal.row} onClose={() => setModal(null)} />}
    </div>
  );
}
