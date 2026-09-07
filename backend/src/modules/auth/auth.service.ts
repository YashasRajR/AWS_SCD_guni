import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@scd/validation';
import { getEnv } from '../../config/env.js';
import { withTransaction } from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import { usersRepository } from '../users/users.repository.js';
import { toPublicUser } from '../users/users.types.js';
import { attendeesRepository } from '../attendees/attendees.repository.js';
import { emailsService } from '../emails/emails.service.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';
import { authRepository } from './auth.repository.js';
import { parseDurationMs } from './auth.ms.js';
import type { AccessTokenPayload, AuthResult } from './auth.types.js';

const BCRYPT_ROUNDS = 12;

function issueAccessToken(userId: string, email: string, roles: string[], permissions: string[]): string {
  const env = getEnv();
  const payload: AccessTokenPayload = { sub: userId, email, roles: roles as never, permissions };
  const options: jwt.SignOptions = {
    expiresIn: env.AUTH_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  return jwt.sign(payload, env.AUTH_SECRET, options);
}

/** Issues a fresh access + refresh token pair for a user whose identity snapshot has already been loaded. */
async function issueSessionTokens(
  userId: string,
  email: string,
  roles: string[],
  permissions: string[],
): Promise<{ accessToken: string; refreshToken: string; expiresIn: string }> {
  const env = getEnv();
  const accessToken = issueAccessToken(userId, email, roles, permissions);
  const refreshToken = await authRepository.createRefreshToken(
    userId,
    parseDurationMs(env.AUTH_REFRESH_TOKEN_TTL),
  );
  return { accessToken, refreshToken, expiresIn: env.AUTH_TOKEN_TTL };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) {
      throw AppError.duplicate('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    // user + role + attendee must succeed or fail together — a failure
    // partway through (e.g. the attendee insert violating a constraint)
    // must never leave a user row with no role or no attendee profile.
    const user = await withTransaction(async (client) => {
      const createdUser = await usersRepository.create(input.email, passwordHash, client);
      await usersRepository.assignRole(createdUser.id, 'ATTENDEE', client);
      await attendeesRepository.create(
        {
          userId: createdUser.id,
          fullName: input.fullName,
          phone: input.phone,
          university: input.university,
          department: input.department,
          branch: input.branch,
          year: input.year,
          dateOfBirth: input.dateOfBirth,
          companyName: input.companyName,
          designation: input.designation,
          registrationType: input.registrationType,
          linkedinUrl: input.linkedinUrl || undefined,
        },
        client,
      );
      return createdUser;
    });

    // Token issuance + the verification email are best-effort follow-ups,
    // not part of the account's atomicity — emailsService.enqueue never
    // throws, so a failure here can't undo the account that was already
    // committed above (and shouldn't: the user can still request a fresh
    // verification email once delivery is fixed).
    const env = getEnv();
    const verificationToken = await authRepository.createEmailVerificationToken(
      user.id,
      parseDurationMs(env.EMAIL_VERIFICATION_TOKEN_TTL),
    );
    const verificationLink = `${env.PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    await emailsService.enqueue(user.id, user.email, 'email-verification', 'Verify your email', {
      link: verificationLink,
      ttl: env.EMAIL_VERIFICATION_TOKEN_TTL,
    });

    const { roles, permissions } = await usersRepository.getIdentitySnapshot(user.id);
    const tokens = await issueSessionTokens(user.id, user.email, roles, permissions);

    return { user: toPublicUser(user), ...tokens };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await usersRepository.findByEmail(input.email);
    if (!user) throw AppError.invalidCredentials();

    const passwordMatches = await bcrypt.compare(input.password, user.password_hash);
    if (!passwordMatches) throw AppError.invalidCredentials();

    if (user.status !== 'ACTIVE') {
      throw AppError.forbidden('This account is not active. Contact an organizer for help.');
    }

    await usersRepository.touchLastLogin(user.id);
    const { roles, permissions } = await usersRepository.getIdentitySnapshot(user.id);
    const tokens = await issueSessionTokens(user.id, user.email, roles, permissions);

    return { user: toPublicUser(user), ...tokens };
  },

  /**
   * Rotates a refresh token: the presented token is revoked and a new
   * access/refresh pair is issued, re-reading roles/permissions fresh (so
   * a permission change an admin made since the last login takes effect
   * on the next silent refresh, not only on a full re-login). Rotation
   * (rather than reusing the same refresh token indefinitely) means a
   * stolen-then-used refresh token is only ever valid for one hop before
   * the legitimate client's next refresh fails — a signal worth acting on
   * later (e.g. revoking the whole family), though that reuse-detection
   * escalation is not built yet.
   */
  async refresh(input: RefreshTokenInput): Promise<AuthResult> {
    const tokenRow = await authRepository.findValidRefreshToken(input.refreshToken);
    if (!tokenRow) throw AppError.authRequired('Your session has expired. Please log in again.');

    const user = await usersRepository.findById(tokenRow.user_id);
    if (!user || user.status !== 'ACTIVE') {
      await authRepository.revokeRefreshToken(tokenRow.id);
      throw AppError.authRequired('Your session has expired. Please log in again.');
    }

    await authRepository.revokeRefreshToken(tokenRow.id);
    const { roles, permissions } = await usersRepository.getIdentitySnapshot(user.id);
    const tokens = await issueSessionTokens(user.id, user.email, roles, permissions);

    return { user: toPublicUser(user), ...tokens };
  },

  /**
   * Revokes the presented refresh token (real revocation now, not a
   * no-op) so it can't be used for a further silent refresh. The access
   * token itself is still a stateless JWT and remains valid until it
   * expires (at most AUTH_TOKEN_TTL, now short — see issueAccessToken) —
   * there is still no access-token denylist, which is an accepted
   * tradeoff at this scale.
   */
  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const tokenRow = await authRepository.findValidRefreshToken(refreshToken);
    if (tokenRow) await authRepository.revokeRefreshToken(tokenRow.id);
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await usersRepository.findByEmail(input.email);
    // Deliberately do not reveal whether the email exists.
    if (!user) return;

    const env = getEnv();
    const token = await authRepository.createPasswordResetToken(
      user.id,
      parseDurationMs(env.PASSWORD_RESET_TOKEN_TTL),
    );
    const resetLink = `${env.PUBLIC_APP_URL}/reset-password?token=${token}`;
    await emailsService.enqueue(user.id, user.email, 'password-reset', 'Reset your password', {
      link: resetLink,
      ttl: env.PASSWORD_RESET_TOKEN_TTL,
    });
    await auditLogsService.logSystem('PASSWORD_RESET_REQUESTED', 'user', user.id);
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenRow = await authRepository.findValidPasswordResetToken(input.token);
    if (!tokenRow) throw AppError.validation('This reset link is invalid or has expired.');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    await usersRepository.updatePasswordHash(tokenRow.user_id, passwordHash);
    await authRepository.consumePasswordResetToken(tokenRow.id);
    // A password reset can mean the old password was compromised — every
    // existing session (every outstanding refresh token) is revoked so a
    // stale device/browser can't keep silently refreshing past it.
    await authRepository.revokeAllRefreshTokensForUser(tokenRow.user_id);
    await auditLogsService.logSystem('PASSWORD_RESET_COMPLETED', 'user', tokenRow.user_id);
  },

  async verifyEmail(input: VerifyEmailInput): Promise<void> {
    const tokenRow = await authRepository.findValidEmailVerificationToken(input.token);
    if (!tokenRow) throw AppError.validation('This verification link is invalid or has expired.');

    await usersRepository.setEmailVerified(tokenRow.user_id);
    await authRepository.consumeEmailVerificationToken(tokenRow.id);
    await auditLogsService.logSystem('EMAIL_VERIFIED', 'user', tokenRow.user_id);
  },

  /**
   * Authenticated password change — proves knowledge of the CURRENT
   * password (unlike resetPassword's email-token flow). Same
   * every-other-session-revoked behavior as a reset: a password change
   * can mean the old one leaked, so every outstanding refresh token
   * except this request's own flow is invalidated too — the caller's
   * frontend re-authenticates via the fresh tokens issued here.
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<AuthResult> {
    const user = await usersRepository.findById(userId);
    if (!user) throw AppError.notFound('User');

    const currentMatches = await bcrypt.compare(input.currentPassword, user.password_hash);
    if (!currentMatches) throw AppError.validation('Current password is incorrect.');

    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await usersRepository.updatePasswordHash(userId, passwordHash);
    await authRepository.revokeAllRefreshTokensForUser(userId);
    await auditLogsService.logSystem('PASSWORD_CHANGED', 'user', userId);

    const { roles, permissions } = await usersRepository.getIdentitySnapshot(userId);
    const tokens = await issueSessionTokens(userId, user.email, roles, permissions);
    return { user: toPublicUser(user), ...tokens };
  },
};
