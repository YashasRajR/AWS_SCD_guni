import type { AnnouncementPriority, ContentStatus, EventStatus, SessionType, TimelineItemType } from './enums.js';

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

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  publishAt: string | null;
  expiresAt: string | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}
