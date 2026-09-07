import { z } from 'zod';
import { REGISTRATION_TYPES } from '@scd/types';

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

// Minimum bar for a student-facing event platform: 8+ chars, at least one
// letter and one number. Kept deliberately simple — not a security theater
// checklist — since the real defense is hashing + rate limiting, not
// password complexity rules.
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20).optional(),
  university: z.string().trim().max(200).optional(),
  department: z.string().trim().max(200).optional(),
  year: z.string().trim().max(50).optional(),
  registrationType: z.enum(REGISTRATION_TYPES, {
    errorMap: () => ({ message: 'Select whether you are a student or a professional' }),
  }),
  linkedinUrl: z.string().trim().url().max(300).optional().or(z.literal('')),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to register' }),
  }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1, 'refreshToken is required'),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/** Logout's refresh token is optional — a client that lost it (or never had one, e.g. an old session) can still hit this to clear its own state. */
export const logoutSchema = z.object({
  refreshToken: z.string().trim().min(1).optional(),
});
export type LogoutInput = z.infer<typeof logoutSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/** Authenticated password change — requires proving the CURRENT password,
 * unlike resetPasswordSchema's token-based flow (which proves email
 * ownership instead). */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
