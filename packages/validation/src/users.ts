import { z } from 'zod';
import { ROLE_NAMES } from '@scd/types';
import { emailSchema } from './auth.js';

/** Body for POST /admin/users/:userId/roles. */
export const roleNameSchema = z.object({
  role: z.enum(ROLE_NAMES),
});
export type RoleNameInput = z.infer<typeof roleNameSchema>;

/** Body for POST /admin/users/invite. Grants the role to an existing
 * account by email, or creates a brand-new one and emails them a
 * set-password link if none exists yet. */
export const inviteUserSchema = z.object({
  email: emailSchema,
  role: z.enum(ROLE_NAMES),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

/** Path params for /admin/users/:userId/... */
export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

/** Path params for DELETE /admin/users/:userId/roles/:role. */
export const userIdAndRoleParamSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ROLE_NAMES),
});
