import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const completeCheckpointSchema = z.object({
  checkpointId: z.string().uuid(),
  attendeeId: z.string().uuid().optional(),
  registrationNumber: z.string().trim().min(1).optional(),
}).refine((v) => Boolean(v.attendeeId || v.registrationNumber), {
  message: 'Either attendeeId or registrationNumber is required',
});
export type CompleteCheckpointInput = z.infer<typeof completeCheckpointSchema>;

export const attendeeSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
});
export type AttendeeSearchQuery = z.infer<typeof attendeeSearchQuerySchema>;

export const createCheckpointSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(200).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(false),
});
export type CreateCheckpointInput = z.infer<typeof createCheckpointSchema>;

export const updateCheckpointSchema = createCheckpointSchema.partial();
export type UpdateCheckpointInput = z.infer<typeof updateCheckpointSchema>;

/** Body for the admin attendance-reversal correction endpoint. Reason is
 * optional but recommended — it's stored in the audit log entry. */
export const reverseAttendanceSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type ReverseAttendanceInput = z.infer<typeof reverseAttendanceSchema>;

export const attendanceIdParamSchema = z.object({
  attendanceId: z.string().uuid(),
});
