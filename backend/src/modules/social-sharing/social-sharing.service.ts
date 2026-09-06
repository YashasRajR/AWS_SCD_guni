import type { SocialContentType, SocialPlatform, SocialShare } from '@scd/types';
import { socialSharingRepository } from './social-sharing.repository.js';
import { toSocialShare } from './social-sharing.types.js';

/**
 * Model + service boundary only in this phase. No LinkedIn/Instagram API
 * integration and no image generation — this only exposes the attendee's
 * own share history for later phases to build on. Never stores platform
 * credentials.
 */
export const socialSharingService = {
  async listForAttendee(attendeeId: string): Promise<SocialShare[]> {
    return (await socialSharingRepository.listForAttendee(attendeeId)).map(toSocialShare);
  },

  /** Logs that the attendee used a share link -- never stores platform
   * credentials, just the fact and when (spec #28/#57). */
  async record(
    attendeeId: string,
    eventId: string,
    platform: SocialPlatform,
    contentType: SocialContentType,
  ): Promise<void> {
    await socialSharingRepository.record(attendeeId, eventId, platform, contentType);
  },
};
