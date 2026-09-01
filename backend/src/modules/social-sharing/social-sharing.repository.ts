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
};
