import type { Announcement, Session, Speaker } from '@scd/types';

// Single-event platform — the event name is hardcoded the same way it
// already is in every email template (backend/src/integrations/email/templates.ts)
// and the login page subtitle, rather than fetched just for this string.
const EVENT_NAME = 'AWS Student Community Day 2026';
const HASHTAGS = '#AWSStudentCommunityDay #AWS #CloudComputing';

/**
 * Templated share-copy generators (spec #28) — plain string templates
 * from data the admin already has loaded, no AI generation and no real
 * posting to any platform. An admin copies the text and pastes it into
 * LinkedIn/Twitter/wherever themselves.
 */
export function generateSpeakerPost(speaker: Speaker): string {
  const role = [speaker.designation, speaker.organization].filter(Boolean).join(', ');
  const lines = [
    `Speaker announcement! We're excited to welcome ${speaker.name}${role ? ` (${role})` : ''} to ${EVENT_NAME}.`,
  ];
  if (speaker.bio) lines.push(speaker.bio);
  if (speaker.linkedinUrl) lines.push(speaker.linkedinUrl);
  lines.push(HASHTAGS);
  return lines.join('\n\n');
}

export function generateSessionPost(session: Session): string {
  const lines = [`Don't miss "${session.title}" at ${EVENT_NAME}!`];
  if (session.description) lines.push(session.description);
  if (session.track) lines.push(`Track: ${session.track}`);
  lines.push(HASHTAGS);
  return lines.join('\n\n');
}

export function generateAnnouncementPost(announcement: Announcement): string {
  const lines = [announcement.title, announcement.message];
  lines.push(HASHTAGS);
  return lines.join('\n\n');
}
