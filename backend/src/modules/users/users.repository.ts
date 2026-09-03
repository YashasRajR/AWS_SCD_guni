import type { Pool, PoolClient } from 'pg';
import { getPool } from '../../config/database.js';
import type { RoleName } from '@scd/types';
import type { ListQueryParams } from '../../utils/sql.js';
import type { IdentitySnapshot, UserRow, UserWithRolesRow } from './users.types.js';

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

  async findById(id: string, db: Queryable = getPool()): Promise<UserRow | null> {
    const { rows } = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
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

  async revokeRole(userId: string, roleName: RoleName, db: Queryable = getPool()): Promise<void> {
    await db.query(
      `DELETE FROM user_roles
       WHERE user_id = $1 AND role_id = (SELECT id FROM roles WHERE name = $2)`,
      [userId, roleName],
    );
  },

  /**
   * Locks the role's own row (not an aggregate — Postgres can't FOR UPDATE
   * a COUNT) so concurrent revoke-the-last-holder requests serialize
   * against each other, then returns how many users currently hold it.
   * Must be called inside the same transaction as the revoke it's
   * protecting.
   */
  async lockRoleAndCountHolders(roleName: RoleName, db: Queryable): Promise<number> {
    const roleRes = await db.query<{ id: string }>(
      'SELECT id FROM roles WHERE name = $1 FOR UPDATE',
      [roleName],
    );
    const roleId = roleRes.rows[0]?.id;
    if (!roleId) return 0;
    const countRes = await db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM user_roles WHERE role_id = $1',
      [roleId],
    );
    return Number(countRes.rows[0]?.count ?? 0);
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

  /** Single user with roles aggregated — used to return a fresh view after a role change. */
  async findByIdWithRoles(userId: string): Promise<UserWithRolesRow | null> {
    const { rows } = await getPool().query<UserWithRolesRow>(
      `SELECT u.*, COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS role_names
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId],
    );
    return rows[0] ?? null;
  },

  /** Admin listing: every user with their roles aggregated, optional email search. */
  async adminList(params: ListQueryParams): Promise<{ rows: UserWithRolesRow[]; total: number }> {
    const { page, pageSize, search } = params;
    const values: unknown[] = [];
    const conditions: string[] = [];
    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`u.email ILIKE $${values.length}`);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalRes = await getPool().query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users u ${where}`,
      values,
    );
    const total = Number(totalRes.rows[0]?.count ?? 0);

    const limitIdx = values.length + 1;
    const offsetIdx = values.length + 2;
    const { rows } = await getPool().query<UserWithRolesRow>(
      `SELECT u.*, COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS role_names
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...values, pageSize, (page - 1) * pageSize],
    );
    return { rows, total };
  },
};
