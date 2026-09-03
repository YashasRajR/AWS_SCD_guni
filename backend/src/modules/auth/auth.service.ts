import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type {
  ForgotPasswordInput,
  LoginInput,
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
import { authRepository } from './auth.repository.js';
import { parseDurationMs } from './auth.ms.js';
import type { AccessTokenPayload, AuthResult } from './auth.types.js';

const BCRYPT_ROUNDS = 12;

function issueAccessToken(userId: string, email: string, roles: string[], permissions: string[]): string {
  const env = getEnv();
  const payload: AccessTokenPayload = { sub: userId, email, roles: roles as never, permissions };
  const options: jwt.SignOptions = { expiresIn: env.AUTH_TOKEN_TTL as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, env.AUTH_SECRET, options);
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
          year: input.year,
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
    const accessToken = issueAccessToken(user.id, user.email, roles, permissions);

    return { user: toPublicUser(user), accessToken, expiresIn: env.AUTH_TOKEN_TTL };
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
    const env = getEnv();
    const accessToken = issueAccessToken(user.id, user.email, roles, permissions);

    return { user: toPublicUser(user), accessToken, expiresIn: env.AUTH_TOKEN_TTL };
  },

  /**
   * Stateless JWT logout: there is no server-side session to destroy, so
   * this is a documented no-op the client pairs with discarding its token.
   * (A denylist/refresh-token revocation store can be added in a later
   * phase if long-lived sessions are introduced.)
   */
  async logout(): Promise<void> {
    return;
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
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenRow = await authRepository.findValidPasswordResetToken(input.token);
    if (!tokenRow) throw AppError.validation('This reset link is invalid or has expired.');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    await usersRepository.updatePasswordHash(tokenRow.user_id, passwordHash);
    await authRepository.consumePasswordResetToken(tokenRow.id);
  },

  async verifyEmail(input: VerifyEmailInput): Promise<void> {
    const tokenRow = await authRepository.findValidEmailVerificationToken(input.token);
    if (!tokenRow) throw AppError.validation('This verification link is invalid or has expired.');

    await usersRepository.setEmailVerified(tokenRow.user_id);
    await authRepository.consumeEmailVerificationToken(tokenRow.id);
  },
};
