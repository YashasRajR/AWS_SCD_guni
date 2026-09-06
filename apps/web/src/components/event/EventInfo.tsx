import { useEvent, useTicketPlans, useSpeakers, useSessions, useVenues } from '../../lib/queries.js';
import { formatDate, formatTime } from '../../lib/format.js';
import { Section, SectionHeader, SectionEyebrow, SectionTitle } from '../layout/Section.js';
import { SkeletonCard } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { CalendarIcon, ClockIcon, MapPinIcon, TicketIcon, UsersIcon, CodeIcon } from '../ui/Icon.js';

/**
 * Event Information + Highlights KPI cards (spec #7). Every value comes
 * from an API resource — event/ticket-plans/speakers/sessions/venues —
 * none of it is hardcoded here. Ticket plans render by their own
 * admin-given name/price (e.g. "Student", "Professional") rather than
 * two fixed "student"/"professional" labels, since plans are themselves
 * admin-configurable, not a fixed pair.
 */
export function EventInfo() {
  const { data: event, loading, error, notFound, reload } = useEvent();
  const { items: ticketPlans } = useTicketPlans();
  const { items: speakers } = useSpeakers();
  const { items: sessions } = useSessions();
  const { items: venues } = useVenues();

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

  const totalCapacity = venues.reduce((sum, v) => sum + (v.capacity ?? 0), 0);

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
    ...ticketPlans
      .filter((plan) => plan.isActive)
      .map((plan) => ({
        icon: <TicketIcon />,
        label: plan.name,
        value: Number(plan.price) > 0 ? `${plan.currency} ${plan.price}` : 'Free',
      })),
    ...(speakers.length > 0 ? [{ icon: <UsersIcon />, label: 'Speakers', value: String(speakers.length) }] : []),
    ...(sessions.length > 0 ? [{ icon: <CodeIcon />, label: 'Sessions', value: String(sessions.length) }] : []),
    ...(totalCapacity > 0 ? [{ icon: <UsersIcon />, label: 'Capacity', value: totalCapacity.toLocaleString() }] : []),
  ];

  return (
    <Section id="event-info">
      <SectionHeader>
        <SectionEyebrow>Event Information</SectionEyebrow>
        <SectionTitle>Everything you need to know</SectionTitle>
      </SectionHeader>
      <div className="info-grid">
        {cards.map((c, i) => (
          <div key={`${c.label}-${i}`} className="info-card">
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
