import { Link } from 'react-router-dom';
import type { PastEvent } from '@scd/types';
import { formatDate } from '../../lib/format.js';
import { ExternalLinkIcon } from '../ui/Icon.js';

export function PastEventCard({ event }: { event: PastEvent }) {
  return (
    <article
      className="past-event-card k"
      style={{
        padding: 0,
        background: 'var(--scd-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        border: '1.25px solid var(--scd-border)',
        borderRadius: '8px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Top Banner / Poster */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/9',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--scd-surface-muted)',
        }}
      >
        {event.sessionImage ? (
          <img
            src={event.sessionImage}
            alt={event.eventName}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.35s ease',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--scd-mono)',
              fontSize: '12px',
              color: 'var(--scd-muted)',
              background: 'repeating-linear-gradient(45deg, #e6e2da 0 6px, #f4f1eb 6px 12px)',
            }}
          >
            {event.year} EDITION
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Edition Badge */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
          <span
            className="chip on"
            style={{
              fontSize: '10px',
              fontWeight: 700,
              background: 'var(--scd-accent, #ff9900)',
              color: '#000',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            {event.year} Edition
          </span>
        </div>

        {/* Date overlay */}
        {event.eventDate && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#fff',
              fontSize: '11px',
              fontFamily: 'var(--scd-mono)',
              fontWeight: 600,
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              zIndex: 2,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{formatDate(event.eventDate)}</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
        <h3 className="d3" style={{ margin: 0, fontSize: '17px', lineHeight: 1.3 }}>
          {event.eventName}
        </h3>

        {event.sessionName && (
          <p className="mo" style={{ color: 'var(--scd-primary)', fontSize: '12px', fontWeight: 600, margin: 0 }}>
            {event.sessionName}
          </p>
        )}

        {event.shortDescription && (
          <p
            className="tx"
            style={{
              fontSize: '12px',
              lineHeight: 1.5,
              color: 'var(--scd-muted)',
              flex: 1,
              margin: '4px 0 0',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {event.shortDescription}
          </p>
        )}

        {event.location && (
          <p
            className="mo"
            style={{
              fontSize: '11px',
              color: 'var(--scd-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: 'auto',
              paddingTop: '6px',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{event.location}</span>
          </p>
        )}

        <div
          className="r"
          style={{
            gap: '8px',
            marginTop: '8px',
            paddingTop: '10px',
            borderTop: '1px solid var(--scd-border)',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/gallery" className="btn g" style={{ fontSize: '11px', padding: '6px 12px', textDecoration: 'none' }}>
            See photos →
          </Link>
          {event.archiveUrl && (
            <a
              href={event.archiveUrl}
              target="_blank"
              rel="noreferrer"
              className="btn o"
              style={{ fontSize: '11px', padding: '6px 12px', textDecoration: 'none' }}
            >
              Event Page <ExternalLinkIcon width={10} height={10} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
