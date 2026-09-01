import type { EventWrapped } from '@scd/types';
import { eventWrappedRepository } from './event-wrapped.repository.js';
import { toEventWrapped } from './event-wrapped.types.js';

/**
 * Model + service boundary only in this phase — the statistics-generation
 * job (real session/checkpoint counts → structured JSON) and the visual
 * asset generator both land in a later phase. This only reads whatever
 * has already been generated for the attendee, or null.
 */
export const eventWrappedService = {
  async getForAttendee(attendeeId: string, eventId: string): Promise<EventWrapped | null> {
    const row = await eventWrappedRepository.findForAttendee(attendeeId, eventId);
    return row ? toEventWrapped(row) : null;
  },
};
