import type { EventWrapped, EventWrappedStatistics } from '@scd/types';
import { eventWrappedRepository } from './event-wrapped.repository.js';
import { toEventWrapped } from './event-wrapped.types.js';
import { achievementsService } from '../achievements/achievements.service.js';
import { getPool } from '../../config/database.js';

export const eventWrappedService = {
  async getForAttendee(attendeeId: string, eventId: string): Promise<EventWrapped | null> {
    const row = await eventWrappedRepository.findForAttendee(attendeeId, eventId);
    return row ? toEventWrapped(row) : null;
  },

  /**
   * Generate (or regenerate) event wrapped statistics for an attendee.
   * Uses real data: achievements and certificate status.
   * Idempotent: overwrites any existing wrapped for this attendee+event.
   */
  async generate(attendeeId: string, eventId: string): Promise<EventWrapped> {
    const achievements = await achievementsService.listForAttendee(attendeeId);

    // Check if attendee has a certificate
    const { rows: certRows } = await getPool().query(
      `SELECT 1 FROM certificates WHERE attendee_id = $1 AND status = 'ISSUED' LIMIT 1`,
      [attendeeId],
    );

    const statistics: EventWrappedStatistics = {
      sessionsAttended: 0, // Will be populated when session-level tracking is added
      achievementsUnlocked: achievements.length,
      certificateUnlocked: certRows.length > 0,
      topInterest: null, // Will be derived from session tracks when available
    };

    // Build summary text
    const summaryParts: string[] = [];
    if (achievements.length > 0) {
      summaryParts.push(`You earned ${achievements.length} achievement${achievements.length > 1 ? 's' : ''}.`);
    }
    if (certRows.length > 0) {
      summaryParts.push('You received your event certificate.');
    }
    const summary = summaryParts.length > 0 ? summaryParts.join(' ') : null;

    const row = await eventWrappedRepository.upsert(attendeeId, eventId, statistics, summary);
    return toEventWrapped(row);
  },
};
