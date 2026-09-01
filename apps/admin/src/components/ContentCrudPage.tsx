import { useState } from 'react';
import type { ReactNode } from 'react';
import { usePaginatedResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { ApiClientError } from '@scd/api-client';
import { Table, type Column } from './Table.js';
import { Pagination } from './Pagination.js';
import { Modal } from './Modal.js';
import { ResourceForm, type FieldDef, type FormValues } from './ResourceForm.js';

interface ContentCrudPageProps<T extends { id: string }> {
  title: string;
  description?: string;
  basePath: string;
  columns: Column<T>[];
  fields: FieldDef[];
  rowToFormValues: (row: T) => FormValues;
  /**
   * Extra fields merged into the create payload that are NOT shown as form
   * inputs — e.g. `{ eventId: currentEventId }`, since there's only one
   * event and asking the admin to paste its UUID would be poor UX.
   */
  createExtraValues?: FormValues;
  newButtonLabel?: string;
  extraToolbar?: ReactNode;
}

export function ContentCrudPage<T extends { id: string }>({
  title,
  description,
  basePath,
  columns,
  fields,
  rowToFormValues,
  createExtraValues,
  newButtonLabel,
  extraToolbar,
}: ContentCrudPageProps<T>) {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error, reload } = usePaginatedResource<T>(basePath, page);
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; row: T } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const handleCreate = async (values: FormValues) => {
    await apiClient.post(basePath, { ...createExtraValues, ...values });
    setModal(null);
    reload();
  };

  const handleUpdate = async (id: string, values: FormValues) => {
    await apiClient.patch(`${basePath}/${id}`, values);
    setModal(null);
    reload();
  };

  const handleDelete = async (row: T) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    setDeletingId(row.id);
    setRowError(null);
    try {
      await apiClient.delete(`${basePath}/${row.id}`);
      reload();
    } catch (err) {
      setRowError(err instanceof ApiClientError ? err.message : 'Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const columnsWithActions: Column<T>[] = [
    ...columns,
    {
      key: '__actions',
      label: '',
      width: '140px',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn-link" onClick={() => setModal({ mode: 'edit', row })}>
            Edit
          </button>
          <button
            type="button"
            className="btn-link btn-link-danger"
            disabled={deletingId === row.id}
            onClick={() => handleDelete(row)}
          >
            {deletingId === row.id ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        <div className="page-header-actions">
          {extraToolbar}
          <button type="button" className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}>
            {newButtonLabel ?? '+ New'}
          </button>
        </div>
      </div>

      {rowError && <p className="form-error">{rowError}</p>}

      <Table columns={columnsWithActions} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />

      {modal?.mode === 'create' && (
        <Modal title={`New ${title.replace(/s$/, '')}`} onClose={() => setModal(null)}>
          <ResourceForm fields={fields} submitLabel="Create" onSubmit={handleCreate} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.mode === 'edit' && (
        <Modal title={`Edit ${title.replace(/s$/, '')}`} onClose={() => setModal(null)}>
          <ResourceForm
            fields={fields}
            initialValues={rowToFormValues(modal.row)}
            submitLabel="Save changes"
            onSubmit={(values) => handleUpdate(modal.row.id, values)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
