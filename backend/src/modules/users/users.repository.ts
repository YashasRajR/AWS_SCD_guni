import type { Pool, PoolClient } from 'pg';
import { getPool } from '../../config/database.js';
import type { RoleName } from '@scd/types';
import type { IdentitySnapshot, UserRow } from './users.types.js';

/** Accepts either the shared pool or a transaction client, so callers can
 * opt into atomicity (see auth.service.ts's register()) without every
 * method needing two copies. */
type Queryable = Pool | PoolClient;

export const usersRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await getPool().query<UserRow>('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const { rows } = await getPool().query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  async create(email: string, passwordHash: string, db: Queryable = getPool()): Promise<UserRow> {
    const { rows } = await db.query<UserRow>(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *`,
      [email, passwordHash],
    );
    return rows[0]!;
  },

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await getPool().query('UPDATE users SET password_hash = $2 WHERE id = $1', [
      userId,
      passwordHash,
    ]);
  },

  async setEmailVerified(userId: string): Promise<void> {
    await getPool().query('UPDATE users SET email_verified_at = now() WHERE id = $1', [userId]);
  },

  async touchLastLogin(userId: string): Promise<void> {
    await getPool().query('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]);
  },

  async assignRole(userId: string, roleName: RoleName, db: Queryable = getPool()): Promise<void> {
    await db.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = $2
       ON CONFLICT DO NOTHING`,
      [userId, roleName],
    );
  },

  /** Roles + effective permissions (union across all of the user's roles). */
  async getIdentitySnapshot(userId: string): Promise<IdentitySnapshot> {
    const rolesResult = await getPool().query<{ name: RoleName }>(
      `SELECT r.name FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId],
    );
    const permissionsResult = await getPool().query<{ code: string }>(
      `SELECT DISTINCT p.code FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = $1`,
      [userId],
    );
    return {
      roles: rolesResult.rows.map((r) => r.name),
      permissions: permissionsResult.rows.map((r) => r.code),
    };
  },
};
