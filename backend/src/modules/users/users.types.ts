import type { RoleName, User, UserStatus } from '@scd/types';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface IdentitySnapshot {
  roles: RoleName[];
  permissions: string[];
}

export function toPublicUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    emailVerifiedAt: row.email_verified_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

/** Row shape for the admin user list — includes the aggregated role set. */
export interface UserWithRolesRow extends UserRow {
  role_names: RoleName[] | null;
}

export interface UserWithRoles extends User {
  roles: RoleName[];
}

export function toUserWithRoles(row: UserWithRolesRow): UserWithRoles {
  return {
    ...toPublicUser(row),
    roles: row.role_names ?? [],
  };
}
