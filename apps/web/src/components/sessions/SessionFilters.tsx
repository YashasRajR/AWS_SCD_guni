interface SessionFiltersProps {
  options: string[];
  active: string;
  onChange: (value: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  ALL: 'All',
  KEYNOTE: 'Keynote',
  TALK: 'Talk',
  WORKSHOP: 'Workshop',
  PANEL: 'Panel',
  BREAK: 'Break',
};

/**
 * Filter chips built only from session types actually present in the
 * fetched data (plus "All") — never a fixed list that might not match
 * what the API returns.
 */
export function SessionFilters({ options, active, onChange }: SessionFiltersProps) {
  if (options.length <= 1) return null;

  return (
    <div className="session-filters" role="group" aria-label="Filter sessions by type">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={active === option ? 'filter-chip filter-chip-active' : 'filter-chip'}
          aria-pressed={active === option}
          onClick={() => onChange(option)}
        >
          {TYPE_LABELS[option] ?? option}
        </button>
      ))}
    </div>
  );
}
