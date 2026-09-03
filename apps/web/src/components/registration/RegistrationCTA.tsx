import { useAuth } from '../../lib/auth.js';
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

  return (
    <div className="registration-cta">
      <h2>{title}</h2>
      <p>{description}</p>
      {status === 'signed-in' ? (
        <Button to="/dashboard" size="large">
          Go to my dashboard
        </Button>
      ) : (
        <Button to="/register" size="large">
          Register Now
        </Button>
      )}
    </div>
  );
}
