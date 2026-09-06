import { z } from 'zod';
import { REGISTRATION_STATUSES } from '@scd/types';

// --- Admin: update a registration's status --------------------------------
export const updateRegistrationStatusSchema = z.object({
  status: z.enum(REGISTRATION_STATUSES),
});
export type UpdateRegistrationStatusInput = z.infer<typeof updateRegistrationStatusSchema>;

// --- Attendee: register for the event -------------------------------------
export const registerForEventSchema = z.object({
  ticketPlanCode: z.string().trim().min(2).max(40),
  couponCode: z.string().trim().min(2).max(40).optional(),
});
export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;

// --- Attendee: preview a coupon's discount before registering ---------------
export const previewCouponSchema = z.object({
  ticketPlanCode: z.string().trim().min(2).max(40),
  couponCode: z.string().trim().min(2).max(40),
});
export type PreviewCouponInput = z.infer<typeof previewCouponSchema>;
