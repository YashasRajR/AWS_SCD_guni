import type {
  AchievementConditionType,
  CertificateStatus,
  CertificateType,
  ContentStatus,
  EmailStatus,
  EmailTemplate,
  SocialContentType,
  SocialPlatform,
} from './enums.js';

export interface Certificate {
  id: string;
  attendeeId: string;
  certificateNumber: string;
  certificateType: CertificateType;
  title: string;
  issuedAt: string;
  fileUrl: string | null;
  status: CertificateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  conditionType: AchievementConditionType;
  conditionConfig: Record<string, unknown> | null;
  displayOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AttendeeAchievement {
  id: string;
  attendeeId: string;
  achievementId: string;
  unlockedAt: string;
  createdAt: string;
}

export interface EventWrappedStatistics {
  sessionsAttended: number;
  achievementsUnlocked: number;
  certificateUnlocked: boolean;
  topInterest: string | null;
}

export interface EventWrapped {
  id: string;
  attendeeId: string;
  eventId: string;
  statistics: EventWrappedStatistics;
  summary: string | null;
  generatedAt: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialShare {
  id: string;
  attendeeId: string;
  eventId: string;
  platform: SocialPlatform;
  contentType: SocialContentType;
  sharedAt: string;
  createdAt: string;
}

/** "Create My SCD Post" draft (spec #28) -- one per attendee. */
export interface SocialPost {
  id: string;
  attendeeId: string;
  bio: string;
  interests: string[];
  photoUrl: string | null;
  linkedinText: string;
  instagramText: string;
  hashtags: string[];
  eventUrl: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Admin-editable config for "Create My SCD Post" -- singleton (one row). */
export interface SocialPostSettings {
  linkedinEnabled: boolean;
  instagramEnabled: boolean;
  baseHashtags: string[];
  introLines: string[];
  updatedAt: string;
}

export interface EmailRecord {
  id: string;
  userId: string | null;
  recipient: string;
  template: EmailTemplate;
  subject: string;
  status: EmailStatus;
  providerMessageId: string | null;
  sentAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}
