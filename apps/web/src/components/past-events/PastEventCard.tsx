import { Link } from 'react-router-dom';
import type { PastEvent } from '@scd/types';
import { formatDate } from '../../lib/format.js';
import { ExternalLinkIcon } from '../ui/Icon.js';

export function PastEventCard({ event }: { event: PastEvent }) {
  return (
    <article className="past-event-card k" style={{ padding: '16px', gap: '12px', background: 'var(--scd-surface)' }}>
      <div className="r" style={{ alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
        {event.sessionImage ? (
          <div
            style={{
              width: '120px',
              height: '90px',
              borderRadius: '3px',
              overflow: 'hidden',
              flex: 'none',
              border: '1.25px solid var(--scd-border)',
            }}
          >
            <img
              src={event.sessionImage}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
        ) : (
          <div
            style={{
              width: '120px',
              height: '90px',
              borderRadius: '3px',
              flex: 'none',
              background: 'repeating-linear-gradient(45deg, #e6e2da 0 6px, #f4f1eb 6px 12px)',
              border: '1.25px solid var(--scd-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--scd-mono)',
              fontSize: '11px',
              color: 'var(--scd-muted)',
            }}
          >
            {event.year} EDITION
          </div>
        )}

        <div className="c" style={{ flex: '1 1 200px', gap: '6px' }}>
          <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="chip on" style={{ fontSize: '10px' }}>
              {event.year} Edition
            </span>
            {event.eventDate && (
              <span className="mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
                {formatDate(event.eventDate)}
              </span>
            )}
          </div>

          <h3 className="d3" style={{ margin: 0, fontSize: '16px' }}>
            {event.eventName}
          </h3>

          {event.sessionName && (
            <p className="mo" style={{ color: 'var(--scd-primary)', fontSize: '12px' }}>
              {event.sessionName}
            </p>
          )}

          {event.shortDescription && (
            <p className="tx" style={{ fontSize: '12px', lineHeight: 1.5 }}>
              {event.shortDescription}
            </p>
          )}

          {event.location && (
            <p className="mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
              Location: {event.location}
            </p>
          )}

          <div className="r" style={{ gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            <Link to="/gallery" className="btn g" style={{ fontSize: '10px', textDecoration: 'none' }}>
              See photos →
            </Link>
            {event.archiveUrl && (
              <a
                href={event.archiveUrl}
                target="_blank"
                rel="noreferrer"
                className="btn g"
                style={{ fontSize: '10px', textDecoration: 'none' }}
              >
                Archive <ExternalLinkIcon width={10} height={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
