import { Button } from './Button.js';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Shown when a single section's data request fails. Never lets one failed
 * fetch (speakers down, sessions down, …) take out the rest of the page —
 * every data-driven section renders this instead of its content on error.
 */
export function ErrorState({ message = 'Unable to load this section.', onRetry }: ErrorStateProps) {
  return (
    <div className="state-panel state-panel-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <Button variant="outline" size="small" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
