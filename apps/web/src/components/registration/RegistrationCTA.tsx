import { useAuth } from '../../lib/auth.js';
import { useEvent } from '../../lib/queries.js';
import { formatDate, getRegistrationPhase } from '../../lib/format.js';
import { Button } from '../ui/Button.js';

interface RegistrationCTAProps {
  title?: string;
  description?: string;
}

/** A reusable, strategically-placed registration call to action (hero, mid-page, pre-FAQ, footer). */
export function RegistrationCTA({
  title = 'Ready to join us?',
  description = 'Reserve your seat for AWS Student Community Day 2026 — talks, workshops, and a room full of builders like you.',
}: RegistrationCTAProps) {
  const { status } = useAuth();
  const { data: event } = useEvent();
  const phase = getRegistrationPhase(event);

  // Wireframe 1a "Ready to build the future?" fact-chip row — every value
  // comes straight off the real event record, never invented.
  const facts = event
    ? [
        { label: 'Date', value: formatDate(event.eventDate) },
        { label: 'Where', value: event.venue ?? 'TBA' },
        { label: 'Entry', value: event.registrationFee === '0.00' ? 'Free' : `${event.currency} ${event.registrationFee}` },
        { label: 'Status', value: phase === 'open' ? 'Open' : phase === 'not-open' ? 'Opening soon' : 'Closed' },
      ]
    : [];

  return (
    <div className="registration-cta">
      <h2>{title}</h2>
      <p>{description}</p>
      {facts.length > 0 && (
        <div className="registration-cta-facts">
          {facts.map((fact) => (
            <div key={fact.label} className="registration-cta-fact">
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>
      )}
      {status === 'signed-in' ? (
        <Button to="/dashboard" size="large">
          Go to my dashboard
        </Button>
      ) : phase === 'not-open' ? (
        <p className="status-line">Registration opens {formatDate(event?.registrationOpen)}.</p>
      ) : phase === 'closed' ? (
        <p className="status-line">Registration is closed.</p>
      ) : (
        <Button to="/register" size="large">
          Register Now
        </Button>
      )}
    </div>
  );
}
