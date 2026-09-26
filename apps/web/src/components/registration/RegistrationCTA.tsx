import { Link } from 'react-router-dom';
import { useEvent } from '../../lib/queries.js';
import { formatDate, getRegistrationPhase } from '../../lib/format.js';

interface RegistrationCTAProps {
  title?: string;
  description?: string;
}

/**
 * Registration CTA matching Wireframe 1a & dark theme spec:
 * Deep charcoal background, orange accent bar, left-aligned typography,
 * dashed fact chips, vibrant AWS orange button, and crowd silhouette.
 */
export function RegistrationCTA({
  title = 'Ready to build the future?',
  description = 'Join AWS Students Community Day 2026 at Ganpat University.',
}: RegistrationCTAProps) {
  const { data: event } = useEvent();
  const phase = getRegistrationPhase(event);

  const facts = [
    { label: 'Date', value: event?.eventDate ? formatDate(event.eventDate) : '8 Oct' },
    { label: 'Where', value: event?.venue ? 'GUNI' : 'GUNI' },
    {
      label: 'Entry',
      value:
        event?.registrationFee === '0.00'
          ? 'Free'
          : event?.registrationFee
          ? `${event.currency} ${event.registrationFee}`
          : 'Free',
    },
    {
      label: 'Status',
      value: phase === 'open' ? 'Open' : phase === 'not-open' ? 'Opening soon' : 'Closed',
    },
  ];

  return (
    <div
      className="k inv"
      style={{
        padding: '36px 28px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-sm, 4px)',
        border: '1.5px solid var(--primary, #232F3E)',
        background: '#1A222D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '18px',
      }}
    >
      {/* Crowd Silhouette Graphic (7% opacity) */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '520px',
          height: '140px',
          opacity: 0.07,
          pointerEvents: 'none',
          zIndex: 1,
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 500 120" fill="#ffffff" width="100%" height="100%">
          <circle cx="40" cy="40" r="18" />
          <path d="M15 120 C15 75 65 75 65 120 Z" />
          <circle cx="110" cy="32" r="20" />
          <path d="M80 120 C80 65 140 65 140 120 Z" />
          <circle cx="180" cy="45" r="16" />
          <path d="M155 120 C155 80 205 80 205 120 Z" />
          <circle cx="250" cy="30" r="22" />
          <path d="M218 120 C218 60 282 60 282 120 Z" />
          <circle cx="320" cy="42" r="18" />
          <path d="M295 120 C295 76 345 76 345 120 Z" />
          <circle cx="390" cy="35" r="19" />
          <path d="M362 120 C362 70 418 70 418 120 Z" />
          <circle cx="460" cy="40" r="18" />
          <path d="M435 120 C435 75 485 75 485 120 Z" />
        </svg>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '16px',
          width: '100%',
        }}
      >
        {/* Orange Accent Bar (Wireframe hr.rule style="width:70px") */}
        <div
          style={{
            width: '70px',
            height: '3.5px',
            background: 'var(--scd-accent, #FF9900)',
            borderRadius: '2px',
          }}
        />

        <div>
          <h2
            style={{
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              fontWeight: 800,
              fontSize: 'clamp(24px, 3.2vw, 32px)',
              margin: '0 0 6px',
              color: '#ffffff',
              lineHeight: 1.25,
            }}
          >
            {title}
          </h2>
          <p
            className="tx"
            style={{
              color: '#cfc9be',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: '56ch',
            }}
          >
            {description}
          </p>
        </div>

        {/* 4 Dashed Fact Chips Row */}
        <div
          className="r"
          style={{
            gap: '10px',
            width: '100%',
            flexWrap: 'wrap',
            margin: '4px 0 6px',
          }}
        >
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="kd"
              style={{
                flex: '1 1 110px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.25)',
                borderStyle: 'dashed',
                borderWidth: '1px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm, 4px)',
              }}
            >
              <p
                className="mo"
                style={{
                  fontSize: '0.65rem',
                  margin: 0,
                  color: 'var(--scd-accent, #FF9900)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {fact.label}
              </p>
              <p
                className="lbl"
                style={{
                  margin: '4px 0 0',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#ffffff',
                }}
              >
                {fact.value}
              </p>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div>
          {phase === 'not-open' ? (
            <div className="r" style={{ alignItems: 'center', gap: '12px' }}>
              <span
                className="btn g"
                style={{
                  color: '#cfc9be',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  padding: '10px 20px',
                  fontSize: '13px',
                }}
              >
                Opening soon
              </span>
              <p className="mo" style={{ color: '#cfc9be', fontSize: '12px', margin: 0 }}>
                Registration opens {formatDate(event?.registrationOpen)}.
              </p>
            </div>
          ) : phase === 'closed' ? (
            <div className="r" style={{ alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                to="/register"
                className="btn o"
                style={{
                  background: '#FF9900',
                  color: '#14181F',
                  fontWeight: 800,
                  padding: '11px 24px',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Register now →
              </Link>
              <p className="mo" style={{ color: '#cfc9be', fontSize: '12px', margin: 0 }}>
                Seats filling fast · Free entry
              </p>
            </div>
          ) : (
            <Link
              to="/register"
              className="btn o hero-cta-pulse"
              style={{
                background: '#FF9900',
                color: '#14181F',
                fontWeight: 800,
                padding: '11px 24px',
                fontSize: '13px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                letterSpacing: '0.04em',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Register now →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
