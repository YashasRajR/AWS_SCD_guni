import { getPool } from '../../config/database.js';
import type { SocialShareRow } from './social-sharing.types.js';

export const socialSharingRepository = {
  async listForAttendee(attendeeId: string): Promise<SocialShareRow[]> {
    const { rows } = await getPool().query<SocialShareRow>(
      'SELECT * FROM social_shares WHERE attendee_id = $1 ORDER BY shared_at DESC',
      [attendeeId],
    );
    return rows;
  },

  async record(
    attendeeId: string,
    eventId: string,
    platform: SocialShareRow['platform'],
    contentType: SocialShareRow['content_type'],
  ): Promise<void> {
    await getPool().query(
      'INSERT INTO social_shares (attendee_id, event_id, platform, content_type) VALUES ($1, $2, $3, $4)',
      [attendeeId, eventId, platform, contentType],
    );
  },
};
