import type { AgendaItem, Session, Venue } from '@scd/types';

/**
 * Resolves the Venue associated with a given Session.
 * Resolution strategy:
 * 1. Direct agenda link: agendaItem.sessionId === session.id
 * 2. Title matching in agenda: for items created in admin where title was matched but sessionId dropdown was omitted
 * 3. Track matching: if multiple venues and session track matches venue name or room
 * 4. Single venue fallback: if only 1 published venue exists for the event, all sessions take place there
 * 5. Single linked venue fallback: if all agenda items point to the same venue
 */
export function resolveSessionVenue(
  session: Session,
  agenda: AgendaItem[] = [],
  venues: Venue[] = []
): Venue | undefined {
  if (!venues || venues.length === 0) return undefined;

  // 1. Direct link via sessionId
  const directSlot = agenda.find((a) => a.sessionId === session.id);
  if (directSlot?.venueId) {
    const v = venues.find((venue) => venue.id === directSlot.venueId);
    if (v) return v;
  }

  // 2. Title matching in agenda
  if (session.title) {
    const normTitle = session.title.trim().toLowerCase();
    const titleSlot = agenda.find((a) => {
      if (!a.title) return false;
      const aTitle = a.title.trim().toLowerCase();
      return aTitle.includes(normTitle) || normTitle.includes(aTitle);
    });
    if (titleSlot?.venueId) {
      const v = venues.find((venue) => venue.id === titleSlot.venueId);
      if (v) return v;
    }
  }

  // 3. Track matching
  if (session.track && venues.length > 1) {
    const trackLower = session.track.trim().toLowerCase();
    const trackVenue = venues.find(
      (v) =>
        (v.name && v.name.toLowerCase().includes(trackLower)) ||
        (v.room && v.room.toLowerCase().includes(trackLower))
    );
    if (trackVenue) return trackVenue;
  }

  // 4. Single venue fallback (e.g. Auditorium for all event sessions)
  if (venues.length === 1) {
    return venues[0];
  }

  // 5. If all agenda items with venue point to one venue
  const uniqueVenueIds = Array.from(new Set(agenda.map((a) => a.venueId).filter(Boolean)));
  if (uniqueVenueIds.length === 1) {
    const v = venues.find((venue) => venue.id === uniqueVenueIds[0]);
    if (v) return v;
  }

  return undefined;
}

/**
 * Returns the room name string for a session, fetching from Venue:
 * Prefers `venue.room`, falling back to `venue.name`.
 */
export function getSessionRoom(
  session: Session,
  agenda: AgendaItem[] = [],
  venues: Venue[] = []
): string | null {
  const venue = resolveSessionVenue(session, agenda, venues);
  if (!venue) return null;
  return venue.room?.trim() || venue.name?.trim() || null;
}
