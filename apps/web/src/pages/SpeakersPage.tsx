import type { Speaker } from '@scd/types';
import { useResource } from '../lib/hooks.js';

export function SpeakersPage() {
  const { items: speakers, loading, error } = useResource<Speaker>('/speakers');

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>Speakers</h1>
        <p className="page-section-lede">Meet the people leading this year&apos;s talks and workshops.</p>
      </header>

      {loading && <p className="status-line">Loading speakers…</p>}
      {error && <p className="status-line status-error">{error}</p>}
      {!loading && !error && speakers.length === 0 && (
        <p className="status-line">Speakers will be announced soon.</p>
      )}

      <div className="card-grid">
        {speakers.map((s) => (
          <div key={s.id} className="speaker-card">
            {s.profileImage ? (
              <img src={s.profileImage} alt={s.name} className="speaker-photo" />
            ) : (
              <div className="speaker-photo speaker-photo-placeholder">{s.name.charAt(0)}</div>
            )}
            <h3>{s.name}</h3>
            {(s.designation || s.organization) && (
              <p className="speaker-role">
                {s.designation}
                {s.designation && s.organization ? ' · ' : ''}
                {s.organization}
              </p>
            )}
            {s.bio && <p className="speaker-bio">{s.bio}</p>}
            <div className="speaker-links">
              {s.linkedinUrl && (
                <a href={s.linkedinUrl} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              )}
              {s.websiteUrl && (
                <a href={s.websiteUrl} target="_blank" rel="noreferrer">
                  Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
