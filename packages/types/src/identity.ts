import type { RoleName, UserStatus } from './enums.js';

export interface User {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

/** User shape safe to return over the API — password_hash is never exposed. */
export type PublicUser = User;

export interface Role {
  id: string;
  name: RoleName;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  code: string;
  description: string | null;
  createdAt: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
}

export interface AuthenticatedIdentity {
  userId: string;
  email: string;
  roles: RoleName[];
  permissions: string[];
}

export interface AuditLog {
  id: string;
  userId: string | null;
  role: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
