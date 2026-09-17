export interface SessionFiltersProps {
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
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  AWS: 'AWS',
  AIML: 'AI/ML',
  CLOUD: 'Cloud',
  DEVOPS: 'DevOps',
  COMMUNITY: 'Community',
};

export function SessionFilters({ options, active, onChange }: SessionFiltersProps) {
  if (options.length <= 1) return null;

  return (
    <div
      className="session-filters r"
      role="group"
      aria-label="Filter sessions by topic or type"
      style={{ flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}
    >
      {options.map((option) => {
        const isSelected = active === option;
        const label = TYPE_LABELS[option.toUpperCase()] ?? option;
        return (
          <button
            key={option}
            type="button"
            className={`chip ${isSelected ? 'on' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onChange(option)}
            style={{
              cursor: 'pointer',
              border: '1px solid var(--scd-fg)',
              fontFamily: 'var(--scd-mono)',
              fontSize: '11px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: isSelected ? 'var(--scd-accent)' : 'var(--scd-surface)',
              color: 'var(--scd-fg)',
              transition: 'background-color 0.15s ease',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
