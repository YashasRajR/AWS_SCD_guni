import type {
  AnnouncementAudience,
  AnnouncementPriority,
  ContentStatus,
  DisplayFrequency,
  EventStatus,
  SessionType,
  SiteLinkKind,
  TimelineItemType,
} from './enums.js';

export interface EventConfig {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  registrationOpen: string | null;
  registrationClose: string | null;
  status: EventStatus;
  /** "0.00" means this edition is free — the payment flow never triggers. */
  registrationFee: string;
  currency: string;
  // Hero/header/footer/contact content -- admin-editable site chrome (spec
  // sections 4/5/38), all living on this same singleton row.
  heroSubtitle: string | null;
  heroBackgroundImage: string | null;
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  logoUrl: string | null;
  headerCtaLabel: string | null;
  headerCtaUrl: string | null;
  headerCtaVisible: boolean;
  footerText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Speaker {
  id: string;
  name: string;
  designation: string | null;
  organization: string | null;
  bio: string | null;
  profileImage: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  displayOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  title: string;
  description: string | null;
  sessionType: SessionType;
  track: string | null;
  durationMinutes: number | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  speakers?: Speaker[];
}

export interface SessionSpeaker {
  sessionId: string;
  speakerId: string;
}

export interface Venue {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  location: string | null;
  room: string | null;
  capacity: number | null;
  mapUrl: string | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaItem {
  id: string;
  eventId: string;
  sessionId: string | null;
  title: string;
  startTime: string;
  endTime: string;
  venueId: string | null;
  displayOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  session?: Session;
  venue?: Venue;
}

export interface TimelineItem {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  type: TimelineItemType;
  displayOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  displayOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SiteLink {
  id: string;
  kind: SiteLinkKind;
  label: string;
  url: string;
  isExternal: boolean;
  openNewTab: boolean;
  displayOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  publishAt: string | null;
  expiresAt: string | null;
  status: ContentStatus;
  // Popup fields (spec section 40) -- an announcement with showAsPopup
  // renders as a dismissible modal instead of (or in addition to) the
  // top-strip banner; see apps/web's AnnouncementPopup.
  imageUrl: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  showAsPopup: boolean;
  displayFrequency: DisplayFrequency;
  targetAudience: AnnouncementAudience;
  createdAt: string;
  updatedAt: string;
}

/** Downloadable event schedule PDF status (spec #12) -- a singleton. */
export interface SchedulePdfStatus {
  pdfAvailable: boolean;
  isManual: boolean;
  published: boolean;
  generatedAt: string | null;
  updatedAt: string | null;
}

/** About/AWS Section CMS block (spec #6). */
export interface AboutSection {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  displayOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  altText: string | null;
  category: string | null;
  eventYear: number | null;
  sessionId: string | null;
  displayOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PastEvent {
  id: string;
  eventName: string;
  year: number;
  sessionName: string | null;
  sessionImage: string | null;
  shortDescription: string | null;
  eventDate: string | null;
  location: string | null;
  archiveUrl: string | null;
  displayOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TicketPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  /** Decimal string, e.g. "200.00" -- see EventConfig.registrationFee for why. */
  price: string;
  currency: string;
  isActive: boolean;
  displayOrder: number;
  /** Included benefits/items shown on the pricing card, in display order. */
  benefits: string[];
  /** Admin-set seat cap, or null for unlimited (the default -- never a fake number). */
  capacity: number | null;
  /**
   * Remaining seats, derived live from non-cancelled/non-rejected
   * registrations against this plan. Only present when `capacity` is set
   * (undefined otherwise) -- populated on the public listing only.
   */
  spotsLeft?: number | null;
  createdAt: string;
  updatedAt: string;
}
