import { getPool } from '../../config/database.js';
import type { AttendeeAchievementRow } from './achievements.types.js';

export const achievementsRepository = {
  async listUnlockedForAttendee(attendeeId: string): Promise<AttendeeAchievementRow[]> {
    const { rows } = await getPool().query<AttendeeAchievementRow>(
      `SELECT * FROM attendee_achievements WHERE attendee_id = $1 ORDER BY unlocked_at DESC`,
      [attendeeId],
    );
    return rows;
  },
};
