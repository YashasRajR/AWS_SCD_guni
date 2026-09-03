import { useEvent } from '../../lib/queries.js';
import { formatDate, formatTime } from '../../lib/format.js';
import { Section, SectionHeader, SectionEyebrow, SectionTitle } from '../layout/Section.js';
import { SkeletonCard } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { CalendarIcon, ClockIcon, MapPinIcon, TicketIcon } from '../ui/Icon.js';

/**
 * Event Information — every value here comes straight from GET /api/v1/event
 * and only from here; no other component re-derives or duplicates it.
 */
export function EventInfo() {
  const { data: event, loading, error, notFound, reload } = useEvent();

  if (loading) {
    return (
      <Section id="event-info">
        <div className="info-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section id="event-info">
        <ErrorState onRetry={reload} />
      </Section>
    );
  }

  if (notFound || !event) return null;

  const cards = [
    { icon: <CalendarIcon />, label: 'Date', value: formatDate(event.eventDate) },
    {
      icon: <ClockIcon />,
      label: 'Time',
      value: event.startTime || event.endTime ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}` : 'TBA',
    },
    { icon: <MapPinIcon />, label: 'Venue', value: event.venue ?? 'TBA' },
    {
      icon: <TicketIcon />,
      label: 'Registration',
      value:
        event.registrationOpen || event.registrationClose
          ? `${formatDate(event.registrationOpen)} – ${formatDate(event.registrationClose)}`
          : 'Opens soon',
    },
  ];

  return (
    <Section id="event-info">
      <SectionHeader>
        <SectionEyebrow>Event Information</SectionEyebrow>
        <SectionTitle>Everything you need to know</SectionTitle>
      </SectionHeader>
      <div className="info-grid">
        {cards.map((c) => (
          <div key={c.label} className="info-card">
            <span className="info-card-icon">{c.icon}</span>
            <div>
              <p className="info-card-label">{c.label}</p>
              <p className="info-card-value">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
