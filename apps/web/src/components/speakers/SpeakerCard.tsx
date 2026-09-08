import { Link } from 'react-router-dom';
import type { Speaker } from '@scd/types';
import { ExternalLinkIcon } from '../ui/Icon.js';

export function SpeakerCard({ speaker }: { speaker: Speaker }) {
  return (
    <div className="speaker-card">
      {speaker.profileImage ? (
        <img src={speaker.profileImage} alt={speaker.name} className="speaker-photo" loading="lazy" />
      ) : (
        <div className="speaker-photo speaker-photo-placeholder" aria-hidden="true">
          {speaker.name.charAt(0)}
        </div>
      )}
      <h3>{speaker.name}</h3>
      {(speaker.designation || speaker.organization) && (
        <p className="speaker-role">
          {speaker.designation}
          {speaker.designation && speaker.organization ? ' · ' : ''}
          {speaker.organization}
        </p>
      )}
      {speaker.bio && <p className="speaker-bio">{speaker.bio}</p>}
      {(speaker.linkedinUrl || speaker.websiteUrl) && (
        <div className="speaker-links">
          {speaker.linkedinUrl && (
            <a href={speaker.linkedinUrl} target="_blank" rel="noreferrer">
              LinkedIn <ExternalLinkIcon width={12} height={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </a>
          )}
          {speaker.websiteUrl && (
            <a href={speaker.websiteUrl} target="_blank" rel="noreferrer">
              Website <ExternalLinkIcon width={12} height={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </a>
          )}
        </div>
      )}
      <Link to={`/speakers/${speaker.id}`} className="btn-link">
        View profile →
      </Link>
    </div>
  );
}
