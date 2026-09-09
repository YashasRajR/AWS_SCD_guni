import { useState } from 'react';
import type { RoleName, User } from '@scd/types';
import { ROLE_NAMES } from '@scd/types';
import { describeApiError } from '@scd/api-client';
import { usePaginatedResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { Table, type Column } from '../components/Table.js';
import { Pagination } from '../components/Pagination.js';
import { StatusBadge } from '../components/StatusBadge.js';

/** Not a shared domain type — @scd/types' User doesn't carry roles; the
 * backend attaches them only for this admin listing (users.service.ts
 * adminList / toUserWithRoles). */
interface UserWithRoles extends User {
  roles: RoleName[];
}

/**
 * SUPER_ADMIN only (backend-enforced via MANAGE_ROLES) — role grant/revoke
 * is deliberately not reachable by plain ADMIN. An ADMIN who somehow lands
 * here just gets a 403 from every call, surfaced via describeApiError.
 */
export function UsersPage() {
  const [page, setPage] = useState(1);
  const { items, totalItems, totalPages, loading, error, reload } = usePaginatedResource<UserWithRoles>(
    '/admin/users',
    page,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [pendingRole, setPendingRole] = useState<Record<string, RoleName>>({});

  const grantRole = async (user: UserWithRoles) => {
    const role = pendingRole[user.id];
    if (!role) return;
    setBusy(user.id);
    setRowError(null);
    try {
      await apiClient.post(`/admin/users/${user.id}/roles`, { role });
      reload();
    } catch (err) {
      setRowError({ id: user.id, message: describeApiError(err) });
    } finally {
      setBusy(null);
    }
  };

  const revokeRole = async (user: UserWithRoles, role: RoleName) => {
    if (!window.confirm(`Revoke the ${role} role from ${user.email}?`)) return;
    setBusy(user.id);
    setRowError(null);
    try {
      await apiClient.delete(`/admin/users/${user.id}/roles/${role}`);
      reload();
    } catch (err) {
      setRowError({ id: user.id, message: describeApiError(err) });
    } finally {
      setBusy(null);
    }
  };

  const columns: Column<UserWithRoles>[] = [
    { key: 'email', label: 'Email', render: (r) => r.email },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'roles',
      label: 'Roles',
      render: (r) => (
        <div>
          <div className="row-actions">
            {r.roles.length === 0 && <span className="dashboard-card-meta">none</span>}
            {r.roles.map((role) => (
              <span key={role} className="badge badge-blue">
                {role}
                <button
                  type="button"
                  className="btn-link"
                  disabled={busy === r.id}
                  onClick={() => revokeRole(r, role)}
                  title={`Revoke ${role}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {rowError?.id === r.id && <p className="form-error">{rowError.message}</p>}
        </div>
      ),
    },
    {
      key: '__grant',
      label: 'Grant a role',
      width: '260px',
      render: (r) => (
        <div className="row-actions">
          <select
            value={pendingRole[r.id] ?? ''}
            onChange={(e) => setPendingRole((prev) => ({ ...prev, [r.id]: e.target.value as RoleName }))}
          >
            <option value="">Select role…</option>
            {ROLE_NAMES.filter((role) => !r.roles.includes(role)).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-link"
            disabled={busy === r.id || !pendingRole[r.id]}
            onClick={() => grantRole(r)}
          >
            Grant
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="page-description">
            Grant or revoke roles for any registered account. Restricted to SUPER_ADMIN.
          </p>
        </div>
      </div>

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
