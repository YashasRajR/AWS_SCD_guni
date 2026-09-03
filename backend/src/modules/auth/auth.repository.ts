import { createHash, randomBytes } from 'node:crypto';
import { getPool } from '../../config/database.js';
import type { EmailVerificationTokenRow, PasswordResetTokenRow, RefreshTokenRow } from './auth.types.js';

/** Tokens are stored hashed (sha256) — the plaintext only ever exists in
 * the email we (would) send and briefly in memory here. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export const authRepository = {
  hashToken,

  async createPasswordResetToken(userId: string, ttlMs: number): Promise<string> {
    const token = generateToken();
    await getPool().query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + ($3 || ' milliseconds')::interval)`,
      [userId, hashToken(token), ttlMs],
    );
    return token;
  },

  async findValidPasswordResetToken(token: string): Promise<PasswordResetTokenRow | null> {
    const { rows } = await getPool().query<PasswordResetTokenRow>(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now()`,
      [hashToken(token)],
    );
    return rows[0] ?? null;
  },

  async consumePasswordResetToken(id: string): Promise<void> {
    await getPool().query('UPDATE password_reset_tokens SET consumed_at = now() WHERE id = $1', [
      id,
    ]);
  },

  async createEmailVerificationToken(userId: string, ttlMs: number): Promise<string> {
    const token = generateToken();
    await getPool().query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + ($3 || ' milliseconds')::interval)`,
      [userId, hashToken(token), ttlMs],
    );
    return token;
  },

  async findValidEmailVerificationToken(token: string): Promise<EmailVerificationTokenRow | null> {
    const { rows } = await getPool().query<EmailVerificationTokenRow>(
      `SELECT * FROM email_verification_tokens
       WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now()`,
      [hashToken(token)],
    );
    return rows[0] ?? null;
  },

  async consumeEmailVerificationToken(id: string): Promise<void> {
    await getPool().query(
      'UPDATE email_verification_tokens SET consumed_at = now() WHERE id = $1',
      [id],
    );
  },

  async createRefreshToken(userId: string, ttlMs: number): Promise<string> {
    const token = generateToken();
    await getPool().query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + ($3 || ' milliseconds')::interval)`,
      [userId, hashToken(token), ttlMs],
    );
    return token;
  },

  async findValidRefreshToken(token: string): Promise<RefreshTokenRow | null> {
    const { rows } = await getPool().query<RefreshTokenRow>(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
      [hashToken(token)],
    );
    return rows[0] ?? null;
  },

  async revokeRefreshToken(id: string): Promise<void> {
    await getPool().query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [id]);
  },

  /** Used on password reset — a compromised/changed password should invalidate every existing session, not just future logins. */
  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await getPool().query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
  },
};
