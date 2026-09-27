import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

/**
 * Distinct from Mascot (used for the site's header/footer/loading states) so
 * an empty list doesn't just look like a stalled mascot -- a clock-in-orbit
 * glyph reads as "content is on its way", matching copy like "will be
 * published soon".
 */
function ClockOrbitIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="28" r="26" stroke="var(--border-dashed, #C7CDD6)" strokeWidth="1.5" strokeDasharray="3 4" />
      <circle cx="28" cy="28" r="16" fill="#232F3E" />
      <path d="M28 20V28L33 31.5" stroke="#FF9900" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="45" cy="15" r="4" fill="#FF9900" />
    </svg>
  );
}

/** Wireframe: Every empty state = icon + one line + one action */
export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="k mut" style={{ alignItems: 'center', textAlign: 'center', padding: '32px 20px', gap: '12px', margin: '16px auto', maxWidth: '440px' }}>
      <ClockOrbitIcon />
      <p className="lbl" style={{ fontSize: '15px' }}>{message}</p>
      {action && <div style={{ marginTop: '4px' }}>{action}</div>}
    </div>
  );
}
