import { z } from 'zod';

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
