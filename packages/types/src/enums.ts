// ============================================================
// Shared enums / string-literal unions used across the platform.
// Kept as string unions (not TS `enum`) so they serialize cleanly
// to/from JSON and match Postgres CHECK-constrained text columns.
// ============================================================

export const ROLE_NAMES = [
  'ADMIN',
  'VOLUNTEER',
  'ATTENDEE',
  'SUPER_ADMIN',
  'FINANCE_ADMIN',
  'CONTENT_ADMIN',
  'VOLUNTEER_MANAGER',
] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const REGISTRATION_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'WAITLISTED',
  'CANCELLED',
  'REJECTED',
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const TICKET_STATUSES = ['ISSUED', 'REVOKED'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const DISCOUNT_TYPES = ['PERCENT', 'FIXED'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const SITE_LINK_KINDS = ['NAV', 'SOCIAL'] as const;
export type SiteLinkKind = (typeof SITE_LINK_KINDS)[number];

export const DISPLAY_FREQUENCIES = ['ONCE', 'EVERY_VISIT', 'UNTIL_DISMISSED'] as const;
export type DisplayFrequency = (typeof DISPLAY_FREQUENCIES)[number];

export const ANNOUNCEMENT_AUDIENCES = ['ALL', 'ATTENDEE', 'GUEST'] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export const QR_TOKEN_TYPES = ['REGISTRATION', 'GOODIE'] as const;
export type QrTokenType = (typeof QR_TOKEN_TYPES)[number];

export const QR_TOKEN_STATUSES = ['ACTIVE', 'REVOKED'] as const;
export type QrTokenStatus = (typeof QR_TOKEN_STATUSES)[number];

export const QR_SCAN_RESULTS = [
  'SUCCESS',
  'ALREADY_USED',
  'INVALID',
  'REVOKED',
  'CHECKPOINT_INACTIVE',
  'NOT_ASSIGNED',
] as const;
export type QrScanResult = (typeof QR_SCAN_RESULTS)[number];

export const EVENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const SESSION_TYPES = ['KEYNOTE', 'TALK', 'WORKSHOP', 'PANEL', 'BREAK'] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const CHECKPOINT_ATTENDANCE_STATUSES = ['COMPLETED', 'REVERSED'] as const;
export type CheckpointAttendanceStatus = (typeof CHECKPOINT_ATTENDANCE_STATUSES)[number];

export const VOLUNTEER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number];

export const ASSIGNMENT_STATUSES = ['ACTIVE', 'REVOKED'] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const CERTIFICATE_STATUSES = ['ISSUED', 'REVOKED'] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export const CERTIFICATE_TYPES = ['PARTICIPATION', 'SESSION', 'ACHIEVEMENT'] as const;
export type CertificateType = (typeof CERTIFICATE_TYPES)[number];

export const ACHIEVEMENT_CONDITION_TYPES = [
  'CHECKPOINT_COUNT',
  'SESSION_COUNT',
  'FULL_ATTENDANCE',
  'MANUAL',
] as const;
export type AchievementConditionType = (typeof ACHIEVEMENT_CONDITION_TYPES)[number];

export const SOCIAL_PLATFORMS = ['LINKEDIN', 'INSTAGRAM'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_CONTENT_TYPES = ['CERTIFICATE', 'ACHIEVEMENT', 'EVENT_WRAPPED', 'SCD_POST'] as const;
export type SocialContentType = (typeof SOCIAL_CONTENT_TYPES)[number];

export const EMAIL_STATUSES = ['PENDING', 'SENT', 'FAILED', 'RETRYING'] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export const EMAIL_TEMPLATES = [
  'registration-confirmation',
  'payment-success',
  'payment-failed',
  'ticket',
  'ticket-resend',
  'invoice-resend',
  'password-reset',
  'email-verification',
  'event-announcement',
  'certificate-ready',
  'event-wrapped',
  'waitlisted',
  'registration-rejected',
] as const;
export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

export const ANNOUNCEMENT_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number];

export const TIMELINE_ITEM_TYPES = [
  'REGISTRATION',
  'MEAL',
  'SESSION',
  'BREAK',
  'NETWORKING',
  'CLOSING',
  'OTHER',
] as const;
export type TimelineItemType = (typeof TIMELINE_ITEM_TYPES)[number];
