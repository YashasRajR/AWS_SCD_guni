import { z } from 'zod';
import { ROLE_NAMES } from '@scd/types';

/** Body for POST /admin/users/:userId/roles. */
export const roleNameSchema = z.object({
  role: z.enum(ROLE_NAMES),
});
export type RoleNameInput = z.infer<typeof roleNameSchema>;

/** Path params for /admin/users/:userId/... */
export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

/** Path params for DELETE /admin/users/:userId/roles/:role. */
export const userIdAndRoleParamSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ROLE_NAMES),
});
