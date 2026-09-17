import type { ReactNode } from 'react';
import { Mascot } from './Mascot.js';

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

/** Wireframe: Every empty state = mascot + one line + one action */
export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="k mut" style={{ alignItems: 'center', textAlign: 'center', padding: '32px 20px', gap: '12px', margin: '16px auto', maxWidth: '440px' }}>
      <Mascot variant="default" size={68} />
      <p className="lbl" style={{ fontSize: '15px' }}>{message}</p>
      {action && <div style={{ marginTop: '4px' }}>{action}</div>}
      <p className="mo" style={{ color: 'var(--border-dashed)', marginTop: '4px' }}>Empty state</p>
    </div>
  );
}
