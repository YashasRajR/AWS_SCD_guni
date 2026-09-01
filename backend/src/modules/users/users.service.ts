import type { User } from '@scd/types';
import { usersRepository } from './users.repository.js';
import { toPublicUser, type IdentitySnapshot } from './users.types.js';

export const usersService = {
  async getPublicUserById(userId: string): Promise<User | null> {
    const row = await usersRepository.findById(userId);
    return row ? toPublicUser(row) : null;
  },

  async getIdentitySnapshot(userId: string): Promise<IdentitySnapshot> {
    return usersRepository.getIdentitySnapshot(userId);
  },
};
