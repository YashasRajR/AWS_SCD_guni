import { z } from 'zod';
import { REGISTRATION_STATUSES } from '@scd/types';

// --- Admin: update a registration's status --------------------------------
export const updateRegistrationStatusSchema = z.object({
  status: z.enum(REGISTRATION_STATUSES),
});
export type UpdateRegistrationStatusInput = z.infer<typeof updateRegistrationStatusSchema>;
