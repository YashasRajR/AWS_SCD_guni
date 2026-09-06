import { z } from 'zod';
import {
  CONTENT_STATUSES,
  EVENT_STATUSES,
  SESSION_TYPES,
  TIMELINE_ITEM_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_AUDIENCES,
  DISPLAY_FREQUENCIES,
  DISCOUNT_TYPES,
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
  // 0 = a free event; the payment flow is simply never triggered for it.
  registrationFee: z.coerce.number().min(0).default(0),
  currency: z.string().trim().toUpperCase().length(3).default('INR'),
  // Hero/header/footer/contact site content (spec sections 4/5/38).
  heroSubtitle: z.string().trim().max(300).optional(),
  heroBackgroundImage: z.string().trim().url().optional(),
  primaryCtaLabel: z.string().trim().max(60).optional(),
  primaryCtaUrl: z.string().trim().max(500).optional(),
  secondaryCtaLabel: z.string().trim().max(60).optional(),
  secondaryCtaUrl: z.string().trim().max(500).optional(),
  logoUrl: z.string().trim().url().optional(),
  headerCtaLabel: z.string().trim().max(60).optional(),
  headerCtaUrl: z.string().trim().max(500).optional(),
  headerCtaVisible: z.boolean().default(false),
  footerText: z.string().trim().max(2000).optional(),
  contactEmail: z.string().trim().email().optional(),
  contactPhone: z.string().trim().max(40).optional(),
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
// --- Site links (nav items + social links; a `kind` discriminator keeps
// these two structurally-identical lists as one table/module) -------------
export const createSiteLinkSchema = z.object({
  label: z.string().trim().min(1).max(120),
  url: z.string().trim().min(1).max(500),
  isExternal: z.boolean().default(false),
  openNewTab: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
  status: contentStatusSchema.default('DRAFT'),
});
export type CreateSiteLinkInput = z.infer<typeof createSiteLinkSchema>;
export const updateSiteLinkSchema = createSiteLinkSchema.partial();
export type UpdateSiteLinkInput = z.infer<typeof updateSiteLinkSchema>;

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

// --- Ticket plans -------------------------------------------------------------
export const createTicketPlanSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_]+$/, 'Use uppercase letters, digits, and underscores only (e.g. STUDENT).'),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().min(0),
  currency: z.string().trim().length(3).default('INR'),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});
export type CreateTicketPlanInput = z.infer<typeof createTicketPlanSchema>;
export const updateTicketPlanSchema = createTicketPlanSchema.partial();
export type UpdateTicketPlanInput = z.infer<typeof updateTicketPlanSchema>;

// --- Coupons --------------------------------------------------------------
const isoDateTimeOptional = z.string().datetime().optional();

const couponFieldsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/, 'Use uppercase letters, digits, hyphens, and underscores only (e.g. AWSGUNI25).'),
  name: z.string().trim().max(120).optional(),
  discountType: z.enum(DISCOUNT_TYPES),
  discountValue: z.coerce.number().positive(),
  currency: z.string().trim().length(3).default('INR'),
  startsAt: isoDateTimeOptional,
  endsAt: isoDateTimeOptional,
  maxUses: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().default(1),
  ticketPlanId: z.string().uuid().optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxDiscountAmount: z.coerce.number().min(0).optional(),
  isActive: z.boolean().default(true),
});

// A PERCENT discount over 100 is nonsensical -- checked here rather than
// left to coupons.service.ts so bad input never reaches the database.
const discountValueRefinement = (v: { discountType: string; discountValue: number }) =>
  v.discountType !== 'PERCENT' || v.discountValue <= 100;
const discountValueRefinementOpts = {
  message: 'A percentage discount cannot exceed 100.',
  path: ['discountValue'],
};

export const createCouponSchema = couponFieldsSchema.refine(discountValueRefinement, discountValueRefinementOpts);
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export const updateCouponSchema = couponFieldsSchema.partial().refine((v) => {
  if (!v.discountType || v.discountValue === undefined) return true;
  return discountValueRefinement({ discountType: v.discountType, discountValue: v.discountValue });
}, discountValueRefinementOpts);
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

// --- Announcements -----------------------------------------------------------
export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2).max(300),
  message: z.string().trim().min(2).max(3000),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES).default('NORMAL'),
  publishAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  status: contentStatusSchema.default('DRAFT'),
  // Popup fields (spec section 40).
  imageUrl: z.string().trim().url().optional(),
  buttonLabel: z.string().trim().max(60).optional(),
  buttonUrl: z.string().trim().max(500).optional(),
  showAsPopup: z.boolean().default(false),
  displayFrequency: z.enum(DISPLAY_FREQUENCIES).default('EVERY_VISIT'),
  targetAudience: z.enum(ANNOUNCEMENT_AUDIENCES).default('ALL'),
});
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export const updateAnnouncementSchema = createAnnouncementSchema.partial();
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

// --- Gallery ---------------------------------------------------------------
export const createGalleryItemSchema = z.object({
  imageUrl: z.string().trim().min(1).max(500),
  caption: z.string().trim().max(300).optional(),
  altText: z.string().trim().max(300).optional(),
  category: z.string().trim().max(120).optional(),
  eventYear: z.coerce.number().int().min(2000).max(2100).optional(),
  sessionId: z.string().uuid().optional(),
  displayOrder: z.number().int().min(0).default(0),
  status: contentStatusSchema.default('DRAFT'),
});
export type CreateGalleryItemInput = z.infer<typeof createGalleryItemSchema>;
export const updateGalleryItemSchema = createGalleryItemSchema.partial();
export type UpdateGalleryItemInput = z.infer<typeof updateGalleryItemSchema>;

// --- Past events -------------------------------------------------------------
export const createPastEventSchema = z.object({
  eventName: z.string().trim().min(2).max(200),
  year: z.coerce.number().int().min(2000).max(2100),
  sessionName: z.string().trim().max(300).optional(),
  sessionImage: z.string().trim().max(500).optional(),
  shortDescription: z.string().trim().max(1000).optional(),
  eventDate: dateOnlySchema.optional(),
  location: z.string().trim().max(300).optional(),
  archiveUrl: z.string().trim().url().optional(),
  displayOrder: z.number().int().min(0).default(0),
  status: contentStatusSchema.default('DRAFT'),
});
export type CreatePastEventInput = z.infer<typeof createPastEventSchema>;
export const updatePastEventSchema = createPastEventSchema.partial();
export type UpdatePastEventInput = z.infer<typeof updatePastEventSchema>;
