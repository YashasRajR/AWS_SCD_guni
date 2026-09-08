import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  /** Optional action rendered below the message (e.g. a "Clear filters" button). */
  action?: ReactNode;
}

/** Shown instead of a broken/empty layout when a section legitimately has no data yet. */
export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="state-panel">
      <p>{message}</p>
      {action}
    </div>
  );
}
