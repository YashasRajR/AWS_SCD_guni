import { Link } from 'react-router-dom';
import type { Speaker } from '@scd/types';
import { ExternalLinkIcon } from '../ui/Icon.js';

export function SpeakerCard({
  speaker,
  featured = false,
  onSelect,
  isSelected = false,
}: {
  speaker: Speaker;
  featured?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
}) {
  const roleText = [speaker.designation, speaker.organization].filter(Boolean).join(' · ');

  return (
    <article
      className={`speaker-card k ${isSelected ? 'speaker-card-selected' : ''}`}
      data-reveal
      onClick={onSelect}
      style={{
        cursor: onSelect ? 'pointer' : undefined,
        border: isSelected ? '2px solid var(--scd-accent)' : '1.25px solid var(--scd-border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.2s ease',
        background: 'var(--scd-surface)',
      }}
    >
      <div
        style={{
          aspectRatio: '4/5',
          width: '100%',
          overflow: 'hidden',
          borderRadius: '3px',
          background: 'var(--scd-surface-muted)',
          position: 'relative',
        }}
      >
        {speaker.profileImage ? (
          <img
            src={speaker.profileImage}
            alt={speaker.name}
            className="speaker-photo speaker-duotone"
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(0.6) contrast(1.1) brightness(0.95)',
              transition: 'filter 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'grayscale(0.6) contrast(1.1) brightness(0.95)';
            }}
          />
        ) : (
          <div
            className="speaker-photo speaker-photo-placeholder"
            aria-hidden="true"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--scd-mono)',
              fontSize: featured ? '48px' : '28px',
              fontWeight: 800,
              background: 'repeating-linear-gradient(45deg, #e6e2da 0 6px, #f4f1eb 6px 12px)',
              color: 'var(--scd-primary)',
            }}
          >
            {speaker.name ? speaker.name.charAt(0) : 'S'}
          </div>
        )}
      </div>

      <h3 className="d3" style={{ margin: '4px 0 0', fontSize: featured ? '18px' : '15px' }}>
        {speaker.name}
      </h3>

      {roleText && (
        <p className="speaker-role mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
          {roleText}
        </p>
      )}

      {speaker.bio && (
        <p
          className="speaker-bio tx"
          style={{
            fontSize: '12px',
            lineHeight: 1.5,
            display: featured ? '-webkit-box' : undefined,
            WebkitLineClamp: featured ? 4 : undefined,
            WebkitBoxOrient: featured ? 'vertical' : undefined,
            overflow: featured ? 'hidden' : undefined,
          }}
        >
          {speaker.bio}
        </p>
      )}

      {(speaker.linkedinUrl || speaker.websiteUrl) && (
        <div className="speaker-links r" style={{ gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
          {speaker.linkedinUrl && (
            <a
              href={speaker.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="chip"
              style={{ fontSize: '10px', textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              LinkedIn <ExternalLinkIcon width={10} height={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </a>
          )}
          {speaker.websiteUrl && (
            <a
              href={speaker.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="chip"
              style={{ fontSize: '10px', textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              Website <ExternalLinkIcon width={10} height={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </a>
          )}
        </div>
      )}

      <div style={{ marginTop: '4px' }}>
        <Link
          to={`/speakers/${speaker.id}`}
          className="btn-link mo"
          style={{ fontSize: '11px', textDecoration: 'none', color: 'var(--scd-accent)' }}
          onClick={(e) => e.stopPropagation()}
        >
          View profile →
        </Link>
      </div>
    </article>
  );
}
