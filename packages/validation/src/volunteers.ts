import { z } from 'zod';
import { VOLUNTEER_STATUSES } from '@scd/types';

// --- Admin: create/manage volunteer records -----------------------------
// Takes the email of an ALREADY-REGISTERED user (they must sign up through
// the normal /auth/register flow first) rather than a raw user id — much
// easier for an admin to type into a form, and avoids the admin having to
// go look up a UUID first.
export const createVolunteerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2).max(200),
  phone: z.string().trim().max(30).optional(),
});
export type CreateVolunteerInput = z.infer<typeof createVolunteerSchema>;

export const updateVolunteerSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  phone: z.string().trim().max(30).optional(),
  status: z.enum(VOLUNTEER_STATUSES).optional(),
});
export type UpdateVolunteerInput = z.infer<typeof updateVolunteerSchema>;

// --- Admin: assign/revoke a checkpoint for a volunteer -------------------
export const assignCheckpointSchema = z.object({
  checkpointId: z.string().uuid(),
});
export type AssignCheckpointInput = z.infer<typeof assignCheckpointSchema>;
