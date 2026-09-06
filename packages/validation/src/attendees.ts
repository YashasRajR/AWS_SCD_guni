import { z } from 'zod';
import { paginationQuerySchema } from './common.js';

// --- Admin: edit permitted attendee-profile fields (spec #34) -------------
export const updateAttendeeSchema = z.object({
  fullName: z.string().trim().min(2).max(200).optional(),
  phone: z.string().trim().min(5).max(30).optional(),
  university: z.string().trim().min(1).max(200).optional(),
  department: z.string().trim().min(1).max(200).optional(),
  year: z.string().trim().min(1).max(20).optional(),
  registrationType: z.string().trim().min(1).max(50).optional(),
});
export type UpdateAttendeeInput = z.infer<typeof updateAttendeeSchema>;

// --- Admin: soft-delete / restore an attendee (spec #34) -------------------
// Reason is optional -- same convention as checkpoints' reverseAttendanceSchema,
// a step below the mandatory reason on ticket/invoice regeneration.
export const archiveAttendeeSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type ArchiveAttendeeInput = z.infer<typeof archiveAttendeeSchema>;

// --- Admin: list attendees, with an archived toggle -------------------------
export const attendeesListQuerySchema = paginationQuerySchema.extend({
  archived: z.coerce.boolean().default(false),
});
export type AttendeesListQuery = z.infer<typeof attendeesListQuerySchema>;
