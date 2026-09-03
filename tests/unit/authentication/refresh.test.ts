import { describe, expect, it, vi, beforeEach } from 'vitest';

const AUTH_REPO_PATH = '../../../backend/src/modules/auth/auth.repository.js';
const USERS_REPO_PATH = '../../../backend/src/modules/users/users.repository.js';

vi.mock(AUTH_REPO_PATH, () => ({
  authRepository: {
    createRefreshToken: vi.fn(),
    findValidRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllRefreshTokensForUser: vi.fn(),
    createEmailVerificationToken: vi.fn(),
    createPasswordResetToken: vi.fn(),
    findValidPasswordResetToken: vi.fn(),
    consumePasswordResetToken: vi.fn(),
    findValidEmailVerificationToken: vi.fn(),
    consumeEmailVerificationToken: vi.fn(),
  },
}));
vi.mock(USERS_REPO_PATH, () => ({
  usersRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    getIdentitySnapshot: vi.fn(),
    touchLastLogin: vi.fn(),
    updatePasswordHash: vi.fn(),
    create: vi.fn(),
    assignRole: vi.fn(),
  },
}));

const { authRepository } = await import(AUTH_REPO_PATH);
const { usersRepository } = await import(USERS_REPO_PATH);
const { authService } = await import('../../../backend/src/modules/auth/auth.service.js');

const ACTIVE_USER = {
  id: 'user-1',
  email: 'attendee@example.test',
  password_hash: 'hashed',
  email_verified_at: null,
  status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  last_login_at: null,
};

describe('authService.refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usersRepository.getIdentitySnapshot).mockResolvedValue({
      roles: ['ATTENDEE'],
      permissions: [],
    });
    vi.mocked(authRepository.createRefreshToken).mockResolvedValue('new-refresh-token');
  });

  it('rejects an unknown/expired/revoked refresh token', async () => {
    vi.mocked(authRepository.findValidRefreshToken).mockResolvedValue(null);

    await expect(authService.refresh({ refreshToken: 'garbage' })).rejects.toThrow(
      /session has expired/i,
    );
    expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it('rotates a valid token: revokes the old one and issues a new pair', async () => {
    vi.mocked(authRepository.findValidRefreshToken).mockResolvedValue({
      id: 'token-1',
      user_id: 'user-1',
      token_hash: 'hash',
      expires_at: '2099-01-01T00:00:00.000Z',
      revoked_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
    });
    vi.mocked(usersRepository.findById).mockResolvedValue(ACTIVE_USER);

    const result = await authService.refresh({ refreshToken: 'valid-token' });

    expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('token-1');
    expect(authRepository.createRefreshToken).toHaveBeenCalledWith('user-1', expect.any(Number));
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.user.id).toBe('user-1');
  });

  it('rejects and revokes the token for a user who is no longer ACTIVE', async () => {
    vi.mocked(authRepository.findValidRefreshToken).mockResolvedValue({
      id: 'token-2',
      user_id: 'user-2',
      token_hash: 'hash',
      expires_at: '2099-01-01T00:00:00.000Z',
      revoked_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
    });
    vi.mocked(usersRepository.findById).mockResolvedValue({ ...ACTIVE_USER, id: 'user-2', status: 'SUSPENDED' });

    await expect(authService.refresh({ refreshToken: 'valid-token' })).rejects.toThrow(
      /session has expired/i,
    );
    expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('token-2');
  });
});

describe('authService.logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revokes the presented refresh token', async () => {
    vi.mocked(authRepository.findValidRefreshToken).mockResolvedValue({
      id: 'token-3',
      user_id: 'user-1',
      token_hash: 'hash',
      expires_at: '2099-01-01T00:00:00.000Z',
      revoked_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
    });

    await authService.logout('some-refresh-token');

    expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('token-3');
  });

  it('is a no-op when no refresh token is presented', async () => {
    await authService.logout(undefined);
    expect(authRepository.findValidRefreshToken).not.toHaveBeenCalled();
    expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it('is a silent no-op for an already-invalid/unknown token (no error thrown)', async () => {
    vi.mocked(authRepository.findValidRefreshToken).mockResolvedValue(null);
    await expect(authService.logout('already-revoked')).resolves.toBeUndefined();
    expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled();
  });
});
