import type { PaginatedData, RoleName, User } from '@scd/types';
import { withTransaction } from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';
import { usersRepository } from './users.repository.js';
import { toPublicUser, toUserWithRoles, type IdentitySnapshot, type UserWithRoles } from './users.types.js';

export const usersService = {
  async getPublicUserById(userId: string): Promise<User | null> {
    const row = await usersRepository.findById(userId);
    return row ? toPublicUser(row) : null;
  },

  async getIdentitySnapshot(userId: string): Promise<IdentitySnapshot> {
    return usersRepository.getIdentitySnapshot(userId);
  },

  async adminList(params: ListQueryParams): Promise<PaginatedData<UserWithRoles>> {
    const { rows, total } = await usersRepository.adminList(params);
    return {
      items: rows.map(toUserWithRoles),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize) || 1,
      },
    };
  },

  /**
   * Grants a role to a user. SUPER_ADMIN-gated at the route (MANAGE_ROLES
   * permission) — this is the one action ADMIN must never be able to
   * perform on itself or anyone else, so there is no lower-privilege path
   * into this method.
   */
  async assignRole(userId: string, role: RoleName): Promise<UserWithRoles> {
    const target = await usersRepository.findById(userId);
    if (!target) throw AppError.notFound('User');
    await usersRepository.assignRole(userId, role);
    const updated = await usersRepository.findByIdWithRoles(userId);
    return toUserWithRoles(updated!);
  },

  /**
   * Revokes a role from a user. Protected against removing the platform's
   * last SUPER_ADMIN — that would permanently lock everyone out of
   * role management (no ADMIN can grant it back). The role row is locked
   * for the duration of the transaction so two concurrent revokes of the
   * last two SUPER_ADMINs can't both see "2 holders" and both proceed.
   */
  async revokeRole(userId: string, role: RoleName): Promise<UserWithRoles> {
    const target = await usersRepository.findByIdWithRoles(userId);
    if (!target) throw AppError.notFound('User');
    const currentlyHolds = (target.role_names ?? []).includes(role);

    await withTransaction(async (client) => {
      if (currentlyHolds && role === 'SUPER_ADMIN') {
        const holderCount = await usersRepository.lockRoleAndCountHolders(role, client);
        if (holderCount <= 1) {
          throw AppError.validation("Cannot revoke the platform's last SUPER_ADMIN.");
        }
      }
      await usersRepository.revokeRole(userId, role, client);
    });

    const updated = await usersRepository.findByIdWithRoles(userId);
    return toUserWithRoles(updated!);
  },
};
