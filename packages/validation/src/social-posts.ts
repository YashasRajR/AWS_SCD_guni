import { z } from 'zod';
import { SOCIAL_PLATFORMS } from '@scd/types';

// --- Attendee: save/regenerate their "Create My SCD Post" draft (spec #28) -
// Interests and bio come from the attendee themselves -- the generator only
// ever echoes what's typed here plus official event facts, never invents
// achievements/titles/claims (see social-posts.service.ts).
export const saveSocialPostSchema = z.object({
  bio: z.string().trim().min(10, 'Bio must be at least 10 characters.').max(500),
  interests: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  photoUrl: z.string().trim().url().max(1000).optional(),
});
export type SaveSocialPostInput = z.infer<typeof saveSocialPostSchema>;

// --- Attendee: log that they used a share link for their SCD post ---------
export const recordSocialShareSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
});
export type RecordSocialShareInput = z.infer<typeof recordSocialShareSchema>;

// --- Admin: edit the shared template/hashtags/platform toggles -------------
export const updateSocialPostSettingsSchema = z.object({
  linkedinEnabled: z.boolean().optional(),
  instagramEnabled: z.boolean().optional(),
  baseHashtags: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
  introLines: z
    .array(z.string().trim().min(1).max(200))
    .min(1, 'At least one opening line is required.')
    .max(10)
    .optional(),
});
export type UpdateSocialPostSettingsInput = z.infer<typeof updateSocialPostSettingsSchema>;
