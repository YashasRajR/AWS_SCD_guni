import { getPool } from '../../config/database.js';
import type { EventWrappedRow } from './event-wrapped.types.js';

export const eventWrappedRepository = {
  async findForAttendee(attendeeId: string, eventId: string): Promise<EventWrappedRow | null> {
    const { rows } = await getPool().query<EventWrappedRow>(
      'SELECT * FROM event_wrapped WHERE attendee_id = $1 AND event_id = $2',
      [attendeeId, eventId],
    );
    return rows[0] ?? null;
  },
};
