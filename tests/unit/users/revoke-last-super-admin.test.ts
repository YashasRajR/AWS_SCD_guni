import { describe, expect, it, vi, beforeEach } from 'vitest';

const { USERS_REPO_PATH, DATABASE_PATH } = vi.hoisted(() => ({
  USERS_REPO_PATH: '../../../backend/src/modules/users/users.repository.js',
  DATABASE_PATH: '../../../backend/src/config/database.js',
}));

vi.mock(USERS_REPO_PATH, () => ({
  usersRepository: {
    findById: vi.fn(),
    findByIdWithRoles: vi.fn(),
    adminList: vi.fn(),
    assignRole: vi.fn(),
    revokeRole: vi.fn(),
    lockRoleAndCountHolders: vi.fn(),
  },
}));

vi.mock(DATABASE_PATH, () => ({
  // The service only needs the transaction to run its callback with some
  // opaque "client" value — the repository calls inside are mocked anyway.
  withTransaction: vi.fn(async (fn: (client: unknown) => Promise<unknown>) => fn({})),
}));

const { usersRepository } = await import(USERS_REPO_PATH);
const { usersService } = await import('../../../backend/src/modules/users/users.service.js');

describe('usersService.revokeRole — last SUPER_ADMIN protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects revoking SUPER_ADMIN when the user is the only holder', async () => {
    vi.mocked(usersRepository.findByIdWithRoles).mockResolvedValue({
      id: 'user-1',
      email: 'super@dev.local',
      role_names: ['SUPER_ADMIN'],
    } as never);
    vi.mocked(usersRepository.lockRoleAndCountHolders).mockResolvedValue(1);

    await expect(usersService.revokeRole('user-1', 'SUPER_ADMIN')).rejects.toThrow(
      /last SUPER_ADMIN/i,
    );
    expect(usersRepository.revokeRole).not.toHaveBeenCalled();
  });

  it('allows revoking SUPER_ADMIN when another holder still exists', async () => {
    vi.mocked(usersRepository.findByIdWithRoles)
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'super@dev.local',
        role_names: ['SUPER_ADMIN'],
      } as never)
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'super@dev.local',
        role_names: [],
      } as never);
    vi.mocked(usersRepository.lockRoleAndCountHolders).mockResolvedValue(2);

    const result = await usersService.revokeRole('user-1', 'SUPER_ADMIN');
    expect(usersRepository.revokeRole).toHaveBeenCalledWith('user-1', 'SUPER_ADMIN', {});
    expect(result.roles).not.toContain('SUPER_ADMIN');
  });

  it('does not lock/count when the user does not currently hold the role', async () => {
    vi.mocked(usersRepository.findByIdWithRoles)
      .mockResolvedValueOnce({ id: 'user-1', email: 'x@dev.local', role_names: [] } as never)
      .mockResolvedValueOnce({ id: 'user-1', email: 'x@dev.local', role_names: [] } as never);

    await usersService.revokeRole('user-1', 'SUPER_ADMIN');
    expect(usersRepository.lockRoleAndCountHolders).not.toHaveBeenCalled();
    expect(usersRepository.revokeRole).toHaveBeenCalled();
  });
});
