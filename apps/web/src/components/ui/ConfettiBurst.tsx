import { useEffect, useMemo } from 'react';

const CONFETTI_COLORS = ['#FF9900', '#232F3E', '#FFFFFF', '#7C3AED'];
const PARTICLE_COUNT = 22;
const BURST_DURATION_MS = 1800;

interface ConfettiBurstProps {
  onDone?: () => void;
}

/**
 * One-shot confetti burst layered over a CTA on click. Reuses the
 * .confetti-particle / @keyframes confettiFall rules already in
 * index.css (previously unused) rather than adding new CSS for it.
 * Self-removes via onDone once every particle has finished falling.
 */
export function ConfettiBurst({ onDone }: ConfettiBurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: `${Math.round(Math.random() * 100)}%`,
        background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        animationDelay: `${Math.round(Math.random() * 150)}ms`,
        rotate: Math.round(Math.random() * 360),
      })),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), BURST_DURATION_MS + 150);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="confetti-burst" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.left,
            top: 0,
            background: p.background,
            animationDelay: p.animationDelay,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
