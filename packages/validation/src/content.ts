import { z } from 'zod';
import {
  CONTENT_STATUSES,
  EVENT_STATUSES,
  SESSION_TYPES,
  TIMELINE_ITEM_TYPES,
  ANNOUNCEMENT_PRIORITIES,
} from '@scd/types';

// Shared building blocks -----------------------------------------------------
const contentStatusSchema = z.enum(CONTENT_STATUSES);
// TIMESTAMPTZ columns accept a full ISO datetime; DATE columns (event_date)
// accept a plain YYYY-MM-DD.
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format');

// --- Event config ------------------------------------------------------------
export const createEventSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().trim().max(5000).optional(),
  eventDate: dateOnlySchema,
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  venue: z.string().trim().max(300).optional(),
  registrationOpen: z.string().datetime().optional(),
  registrationClose: z.string().datetime().optional(),
  status: z.enum(EVENT_STATUSES).default('DRAFT'),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;
export const updateEventSchema = createEventSchema.partial();
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// --- Speakers ------------------------------------------------------------
export const createSpeakerSchema = z.object({
  name: z.string().trim().min(2).max(200),
  designation: z.string().trim().max(200).optional(),
  organization: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(5000).optional(),
  profileImage: z.string().trim().url().optional(),
  linkedinUrl: z.string().trim().url().optional(),
  websiteUrl: z.string().trim().url().optional(),
  displayOrder: z.number().int().min(0).default(0),
  status: contentStatusSchema.default('DRAFT'),
});
export type CreateSpeakerInput = z.infer<typeof createSpeakerSchema>;
export const updateSpeakerSchema = createSpeakerSchema.partial();
export type UpdateSpeakerInput = z.infer<typeof updateSpeakerSchema>;

// --- Sessions (with speaker links) -------------------------------------------
export const createSessionSchema = z.object({
  title: z.string().trim().min(2).max(300),
  description: z.string().trim().max(5000).optional(),
  sessionType: z.enum(SESSION_TYPES).default('TALK'),
  track: z.string().trim().max(200).optional(),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  status: contentStatusSchema.default('DRAFT'),
  // Speakers for this session — replaces the full set of links on update.
  speakerIds: z.array(z.string().uuid()).optional(),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export const updateSessionSchema = createSessionSchema.partial();
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

// --- Venues ------------------------------------------------------------------
export const createVenueSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(300).optional(),
  room: z.string().trim().max(200).optional(),
  capacity: z.number().int().min(0).optional(),
  mapUrl: z.string().trim().url().optional(),
  status: contentStatusSchema.default('DRAFT'),
});
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export const updateVenueSchema = createVenueSchema.partial();
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;

// --- Agenda items --------------------------------------------------------------
export const createAgendaItemSchema = z
  .object({
    eventId: z.string().uuid(),
    sessionId: z.string().uuid().optional(),
    title: z.string().trim().min(2).max(300),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    venueId: z.string().uuid().optional(),
    displayOrder: z.number().int().min(0).default(0),
    status: contentStatusSchema.default('DRAFT'),
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });
export type CreateAgendaItemInput = z.infer<typeof createAgendaItemSchema>;
// `.refine()` returns a ZodEffects, which has no `.partial()` — the update
// schema is written out separately instead. The end-after-start rule is
// re-checked at the service layer only when both times are present in the
// same patch.
export const updateAgendaItemSchema = z.object({
  eventId: z.string().uuid().optional(),
  sessionId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(2).max(300).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  venueId: z.string().uuid().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  status: contentStatusSchema.optional(),
});
export type UpdateAgendaItemInput = z.infer<typeof updateAgendaItemSchema>;

// --- Timeline items --------------------------------------------------------
export const createTimelineItemSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().trim().min(2).max(300),
  description: z.string().trim().max(3000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  type: z.enum(TIMELINE_ITEM_TYPES).default('OTHER'),
  displayOrder: z.number().int().min(0).default(0),
  status: contentStatusSchema.default('DRAFT'),
});
export type CreateTimelineItemInput = z.infer<typeof createTimelineItemSchema>;
export const updateTimelineItemSchema = createTimelineItemSchema.partial();
export type UpdateTimelineItemInput = z.infer<typeof updateTimelineItemSchema>;

// --- FAQs ----------------------------------------------------------------------
export const createFaqSchema = z.object({
  question: z.string().trim().min(2).max(500),
  answer: z.string().trim().min(2).max(5000),
  category: z.string().trim().max(120).optional(),
  displayOrder: z.number().int().min(0).default(0),
  status: contentStatusSchema.default('DRAFT'),
});
export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export const updateFaqSchema = createFaqSchema.partial();
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;

// --- Announcements -----------------------------------------------------------
export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2).max(300),
  message: z.string().trim().min(2).max(3000),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES).default('NORMAL'),
  publishAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  status: contentStatusSchema.default('DRAFT'),
});
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export const updateAnnouncementSchema = createAnnouncementSchema.partial();
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
