import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  /** ISO date/datetime string -- falls back to 8 October 2026 */
  targetDate?: string | null;
}

const SCD_2026_DATE = '2026-10-08T09:00:00+05:30';

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getRemaining(targetDate: string): Remaining {
  const target = new Date(targetDate).getTime();
  const diff = target - Date.now();
  if (Number.isNaN(diff) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Wireframe 1a's "days hrs min sec — flip tiles". Real live calculation
 * to 8 October 2026 at Ganpat University, Mehsana.
 */
export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const effectiveDate = targetDate && !Number.isNaN(new Date(targetDate).getTime()) ? targetDate : SCD_2026_DATE;
  const [remaining, setRemaining] = useState<Remaining>(() => getRemaining(effectiveDate));

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(effectiveDate));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [effectiveDate]);

  const units: Array<[string, number]> = [
    ['days', remaining.days],
    ['hrs', remaining.hours],
    ['min', remaining.minutes],
    ['sec', remaining.seconds],
  ];

  return (
    <div className="countdown-wireframe-wrap" role="timer" aria-live="off">
      <div className="r" style={{ gap: '6px', alignItems: 'center' }}>
        {units.map(([label, value]) => (
          <div key={label} className="tile" style={{ width: '48px', height: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>{String(value).padStart(2, '0')}</span>
            <span className="mo" style={{ fontSize: '0.62rem', letterSpacing: '0.04em', color: 'var(--muted)', marginTop: '2px' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
