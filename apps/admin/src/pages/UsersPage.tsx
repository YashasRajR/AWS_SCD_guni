import { useState, type FormEvent } from 'react';
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

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleName>('ADMIN');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    setInviteBusy(true);
    setInviteError(null);
    setInviteMessage(null);
    try {
      const result = await apiClient.post<{ user: UserWithRoles; created: boolean }>('/admin/users/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteMessage(
        result.created
          ? `Invite sent to ${result.user.email} — they'll get an email to set a password.`
          : `${result.user.email} already had an account — ${inviteRole} granted.`,
      );
      setInviteEmail('');
      reload();
    } catch (err) {
      setInviteError(describeApiError(err));
    } finally {
      setInviteBusy(false);
    }
  };

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

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Add admin</h2>
        <p className="page-description">
          Enter an email and a role. If they already have an account, the role is granted immediately.
          Otherwise a new account is created and they're emailed a link to set their password.
        </p>
        <form className="resource-form" onSubmit={invite}>
          <div className="form-field">
            <label htmlFor="invite-email">Email</label>
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              placeholder="name@example.com"
              required
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="invite-role">Role</label>
            <select id="invite-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as RoleName)}>
              {ROLE_NAMES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          {inviteError && <p className="form-error">{inviteError}</p>}
          {inviteMessage && <p className="form-success">{inviteMessage}</p>}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={inviteBusy || !inviteEmail}>
              {inviteBusy ? 'Adding…' : 'Add admin'}
            </button>
          </div>
        </form>
      </div>

      <Table columns={columns} rows={items} getRowId={(r) => r.id} loading={loading} error={error} />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onChange={setPage} />
    </div>
  );
}
