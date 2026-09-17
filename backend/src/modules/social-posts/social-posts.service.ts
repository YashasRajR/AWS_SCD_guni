import type { EventConfig, SocialPost, SocialPostSettings } from '@scd/types';
import { getEnv } from '../../config/env.js';
import { eventService } from '../event/event.service.js';
import { socialPostSettingsService } from '../social-post-settings/social-post-settings.service.js';
import { socialPostsRepository } from './social-posts.repository.js';
import { toSocialPost } from './social-posts.types.js';
import { AppError } from '../../utils/errors.js';

/** Deterministic pick so the same attendee's opening line stays stable
 * between page loads, but different attendees (and a regenerate after the
 * bio changes) land on different lines -- the closest this template-based
 * generator gets to "AI variety" without calling an LLM. */
function pickIntroLine(introLines: string[], seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return introLines[hash % introLines.length]!;
}

function slugifyHashtag(interest: string): string {
  return (
    '#' +
    interest
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0]!.toUpperCase() + word.slice(1))
      .join('')
  );
}

function formatEventDate(event: EventConfig): string {
  return new Date(event.eventDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Builds the LinkedIn/Instagram copy from ONLY what the attendee typed
 * (bio, interests) plus official event facts (name/date/venue/URL) — spec
 * #28's "must not invent achievements/organizations/qualifications/job
 * titles/claims" is satisfied by construction: there is no generation
 * step that could add a fact the caller didn't already provide. No AI
 * model is called.
 */
const DEFAULT_SETTINGS: Pick<SocialPostSettings, 'baseHashtags' | 'introLines'> = {
  baseHashtags: ['#AWSStudentCommunityDay', '#AWSSCD2026', '#AWSCloud'],
  introLines: [`🚀 I'm attending {event}!`],
};

export function buildCopy(input: {
  bio: string;
  interests: string[];
  fullName: string;
  event: EventConfig;
  eventUrl: string;
  settings?: Pick<SocialPostSettings, 'baseHashtags' | 'introLines'>;
}) {
  const { bio, interests, fullName, event, eventUrl, settings = DEFAULT_SETTINGS } = input;
  const dateStr = formatEventDate(event);
  const interestHashtags = interests.slice(0, 5).map(slugifyHashtag);
  const hashtags = [...new Set([...settings.baseHashtags, ...interestHashtags])].slice(0, 8);
  const interestsLine = interests.length > 0 ? `Excited about: ${interests.join(', ')}.` : '';
  const introLine = pickIntroLine(settings.introLines, bio + fullName).replace('{event}', event.name);

  const linkedinText = [
    introLine,
    bio,
    interestsLine,
    [`📅 ${dateStr}`, event.venue ? `📍 ${event.venue}` : null].filter(Boolean).join('  ·  '),
    `🔗 ${eventUrl}`,
    hashtags.join(' '),
  ]
    .filter(Boolean)
    .join('\n\n');

  const instagramText = [
    `${fullName} is heading to ${event.name}! ✨`,
    bio,
    interestsLine,
    eventUrl,
    hashtags.join(' '),
  ]
    .filter(Boolean)
    .join('\n\n');

  return { linkedinText, instagramText, hashtags };
}

export const socialPostsService = {
  async get(attendeeId: string): Promise<SocialPost | null> {
    const row = await socialPostsRepository.findByAttendeeId(attendeeId);
    return row ? toSocialPost(row, getEnv().PUBLIC_APP_URL) : null;
  },

  /** Save (or "Regenerate") the draft -- always rebuilds the copy from the
   * given input and clears any prior approval. */
  async save(
    attendeeId: string,
    fullName: string,
    input: { bio: string; interests: string[]; photoUrl?: string },
  ): Promise<SocialPost> {
    const [event, settings] = await Promise.all([eventService.getCurrent(), socialPostSettingsService.get()]);
    const eventUrl = getEnv().PUBLIC_APP_URL;
    const { linkedinText, instagramText, hashtags } = buildCopy({
      bio: input.bio,
      interests: input.interests,
      fullName,
      event,
      eventUrl,
      settings,
    });
    const row = await socialPostsRepository.upsert({
      attendeeId,
      bio: input.bio,
      interests: input.interests,
      photoUrl: input.photoUrl ?? null,
      linkedinText,
      instagramText,
      hashtags,
    });
    return toSocialPost(row, eventUrl);
  },

  /** "Approve" -- stamps the draft as reviewed; the text itself doesn't change. */
  async approve(attendeeId: string): Promise<SocialPost> {
    const row = await socialPostsRepository.approve(attendeeId);
    if (!row) throw AppError.notFound('Social post draft', 'Generate a post before approving it.');
    return toSocialPost(row, getEnv().PUBLIC_APP_URL);
  },
};
