import {
  type CSSProperties,
  type FocusEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface OrbitStackItem {
  id: string;
  name: string;
  role: string;
  description: string;
  accent?: string;
  initials?: string;
  stat?: string;
  image?: string;
  profileUrl?: string;
}

export interface OrbitCardStackProps {
  items?: OrbitStackItem[];
  className?: string;
  cardClassName?: string;
  defaultActiveIndex?: number;
  spread?: number;
  lift?: number;
  onActiveChange?: (item: OrbitStackItem, index: number) => void;
  onSelect?: (item: OrbitStackItem, index: number) => void;
}

const defaultItems: OrbitStackItem[] = [
  {
    id: '1',
    name: 'Harshil Maniyar',
    role: 'Leader · GUNI',
    description: 'Technical Leadership & Cloud Innovation Guide at AWS Student Builder Group.',
    accent: '#FF9900',
    initials: 'HM',
    stat: 'Featured',
  },
  {
    id: '2',
    name: 'Yashas Raj R',
    role: 'Student Builder',
    description: 'Cloud Architect & Community organizer passionate about serverless and AWS CDK.',
    accent: '#232F3E',
    initials: 'YR',
    stat: 'Speaker',
  },
  {
    id: '3',
    name: 'Speaker TBA',
    role: 'Keynote Speaker',
    description: 'Industry AWS Hero or Community Builder to be announced soon.',
    accent: '#50377a',
    initials: 'AWS',
    stat: 'Stay tuned',
  },
];

function inRange(index: number, length: number) {
  return Math.min(Math.max(0, index), Math.max(0, length - 1));
}

function initialsFor(item: OrbitStackItem) {
  if (item.initials) return item.initials;
  return item.name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function ArrowUpRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function Portrait({ item }: { item: OrbitStackItem }) {
  const initials = initialsFor(item);

  if (item.image) {
    return (
      <div className="orbit-card-portrait">
        <img src={item.image} alt={item.name} className="orbit-card-img" />
        <span className="orbit-card-initials-badge">{initials}</span>
      </div>
    );
  }

  return (
    <div
      className="orbit-card-portrait orbit-card-portrait-placeholder"
      style={{ '--portrait-accent': item.accent ?? '#FF9900' } as CSSProperties}
    >
      <div className="orbit-portrait-glow" />
      <div className="orbit-portrait-avatar">
        <div className="orbit-portrait-eyes">
          <span />
          <span />
        </div>
        <div className="orbit-portrait-smile" />
      </div>
      <span className="orbit-card-initials-badge">{initials}</span>
    </div>
  );
}

export function OrbitCardStack({
  items = defaultItems,
  className = '',
  cardClassName = '',
  defaultActiveIndex = 0,
  spread = 150,
  lift = 32,
  onActiveChange,
  onSelect,
}: OrbitCardStackProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(query.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  const cards = items.length ? items : defaultItems;
  const restingIndex = inRange(defaultActiveIndex, cards.length);
  const [activeIndex, setActiveIndex] = useState(restingIndex);
  const [open, setOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const midpoint = (cards.length - 1) / 2;

  // Responsive spread on smaller screens
  const [responsiveSpread, setResponsiveSpread] = useState(spread);
  useEffect(() => {
    const updateSpread = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setResponsiveSpread(Math.min(spread, 55));
      } else if (width < 960) {
        setResponsiveSpread(Math.min(spread, 110));
      } else {
        setResponsiveSpread(spread);
      }
    };
    updateSpread();
    window.addEventListener('resize', updateSpread);
    return () => window.removeEventListener('resize', updateSpread);
  }, [spread]);

  const layouts = useMemo(
    () =>
      cards.map((_, index) => {
        const orbit = index - midpoint;
        const stack = index - restingIndex;
        return {
          open: {
            x: orbit * responsiveSpread,
            y: Math.abs(orbit) * 26 + Math.max(0, Math.abs(orbit) - 1) * 8,
            rotation: orbit * 6.5,
          },
          closed: {
            x: stack * 12,
            y: Math.abs(stack) * 5,
            rotation: stack * 2.8,
          },
        };
      }),
    [cards, midpoint, restingIndex, responsiveSpread],
  );

  const activate = (index: number) => {
    const next = inRange(index, cards.length);
    setOpen(true);
    setActiveIndex(next);
    onActiveChange?.(cards[next]!, next);
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(restingIndex);
  };

  const leaveFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  };

  const handleCardClick = (item: OrbitStackItem, index: number) => {
    activate(index);
    onSelect?.(item, index);
  };

  return (
    <div className={`orbit-card-stack-stage ${className}`}>
      {/* Interactive Helper Indicator */}
      <div className="orbit-stage-hint">
        <span className="chip mo" style={{ fontSize: '10px', color: 'var(--scd-muted)', borderColor: 'var(--scd-border)' }}>
          {open ? 'Card stack fanned out · Tap card to inspect' : 'Hover or tap deck to fan out'}
        </span>
      </div>

      <div
        ref={stageRef}
        className="orbit-card-stage-inner"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={close}
        onBlur={leaveFocus}
        role="list"
        aria-label="Speaker card deck"
      >
        {cards.map((item, index) => {
          const position = open ? layouts[index]!.open : layouts[index]!.closed;
          const active = index === activeIndex;

          const style: CSSProperties = {
            zIndex: active ? 80 : 50 - Math.abs(index - activeIndex),
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${
              position.y - (open && active ? lift : 0)
            }px)) rotate(${position.rotation}deg) scale(${open ? (active ? 1.02 : 0.985) : 0.97})`,
            transitionDuration: reduceMotion ? '0ms' : '420ms',
          };

          return (
            <article
              key={`${item.id}-${index}`}
              role="listitem"
              tabIndex={0}
              aria-current={active ? 'true' : undefined}
              className={`orbit-card-item ${active ? 'is-active' : ''} ${cardClassName}`}
              style={style}
              onMouseEnter={() => activate(index)}
              onFocus={() => activate(index)}
              onClick={() => handleCardClick(item, index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  const next = (index + 1) % cards.length;
                  activate(next);
                  stageRef.current
                    ?.querySelectorAll<HTMLElement>('[role=listitem]')
                    [next]?.focus();
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  const next = (index - 1 + cards.length) % cards.length;
                  activate(next);
                  stageRef.current
                    ?.querySelectorAll<HTMLElement>('[role=listitem]')
                    [next]?.focus();
                }
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleCardClick(item, index);
                }
                if (event.key === 'Escape') {
                  event.currentTarget.blur();
                  close();
                }
              }}
            >
              <div className="orbit-card-portrait-wrapper">
                <Portrait item={item} />
                <button
                  type="button"
                  className="orbit-card-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(item, index);
                  }}
                  aria-label={`View profile for ${item.name}`}
                >
                  <ArrowUpRightIcon size={16} />
                </button>
              </div>

              <div className="orbit-card-body">
                <p className="orbit-card-role">{item.role}</p>
                <h3 className="orbit-card-name">{item.name}</h3>
                <p className="orbit-card-desc">{item.description}</p>
                <div className="orbit-card-footer">
                  <span className="orbit-card-stat">{item.stat ?? 'Speaker'}</span>
                  <span className="orbit-card-view-link">View profile →</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
