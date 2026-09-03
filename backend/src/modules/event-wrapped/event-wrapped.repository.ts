import { getPool } from '../../config/database.js';
import type { EventWrappedRow } from './event-wrapped.types.js';
import type { EventWrappedStatistics } from '@scd/types';

export const eventWrappedRepository = {
  async findForAttendee(attendeeId: string, eventId: string): Promise<EventWrappedRow | null> {
    const { rows } = await getPool().query<EventWrappedRow>(
      'SELECT * FROM event_wrapped WHERE attendee_id = $1 AND event_id = $2',
      [attendeeId, eventId],
    );
    return rows[0] ?? null;
  },

  async upsert(
    attendeeId: string,
    eventId: string,
    statistics: EventWrappedStatistics,
    summary: string | null,
  ): Promise<EventWrappedRow> {
    const { rows } = await getPool().query<EventWrappedRow>(
      `INSERT INTO event_wrapped (attendee_id, event_id, statistics, summary, version)
       VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT (attendee_id, event_id)
       DO UPDATE SET statistics = $3, summary = $4, version = event_wrapped.version + 1
       RETURNING *`,
      [attendeeId, eventId, JSON.stringify(statistics), summary],
    );
    return rows[0]!;
  },
};
