import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  /** ISO date/datetime string -- the event's real eventDate from the API, never a made-up date. */
  targetDate: string;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getRemaining(targetDate: string): Remaining | null {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Wireframe 1a's "days hrs min sec — flip tiles". Computed client-side
 * from the event's real eventDate (never a fabricated countdown) and
 * ticks every second; once the target has passed it renders nothing so
 * the hero falls back to its normal date/venue facts instead of showing
 * a countdown to a day that's already here or gone.
 */
export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<Remaining | null>(() => getRemaining(targetDate));

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(targetDate));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetDate]);

  if (!remaining) return null;

  const units: Array<[string, number]> = [
    ['days', remaining.days],
    ['hrs', remaining.hours],
    ['min', remaining.minutes],
    ['sec', remaining.seconds],
  ];

  return (
    <div className="countdown" role="timer" aria-live="off">
      {units.map(([label, value]) => (
        <div key={label} className="countdown-tile">
          <span className="countdown-value">{String(value).padStart(2, '0')}</span>
          <span className="countdown-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
