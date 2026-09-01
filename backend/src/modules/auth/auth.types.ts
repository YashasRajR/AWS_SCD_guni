import type { PublicUser, RoleName } from '@scd/types';

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  roles: RoleName[];
  permissions: string[];
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  expiresIn: string;
}

export interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}

export interface EmailVerificationTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}
