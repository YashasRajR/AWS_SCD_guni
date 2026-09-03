interface EmptyStateProps {
  message: string;
}

/** Shown instead of a broken/empty layout when a section legitimately has no data yet. */
export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="state-panel">
      <p>{message}</p>
    </div>
  );
}
