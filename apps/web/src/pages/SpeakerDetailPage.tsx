import { Link, useParams } from 'react-router-dom';
import { useSessions, useSpeakers } from '../lib/queries.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { SkeletonText } from '../components/ui/Skeleton.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { ExternalLinkIcon } from '../components/ui/Icon.js';
import { useDocumentHead } from '../lib/seo.js';

/** Wireframe 1d "/speakers/:id": sticky portrait + bio, with the speaker's
 * real sessions (joined client-side by speaker id, same pattern as the
 * session detail page) rather than a fabricated list. */
export function SpeakerDetailPage() {
  const { id } = useParams();
  const { items: speakers, loading, error, reload } = useSpeakers();
  const { items: sessions } = useSessions();

  const speaker = speakers.find((s) => s.id === id);
  const theirSessions = speaker ? sessions.filter((s) => s.speakers?.some((sp) => sp.id === speaker.id)) : [];

  useDocumentHead({ title: speaker ? speaker.name : 'Speaker' });

  return (
    <div className="section">
      <PageContainer>
        <p className="dashboard-card-meta">
          <Link to="/speakers">Speakers</Link> / {speaker?.name ?? '…'}
        </p>

        {loading && <SkeletonText lines={4} />}
        {error && <ErrorState onRetry={reload} />}

        {!loading && !error && !speaker && (
          <div className="empty-state">
            <p>This speaker couldn&apos;t be found.</p>
            <Link to="/speakers" className="btn-link">
              Back to all speakers
            </Link>
          </div>
        )}

        {speaker && (
          <article className="speaker-detail">
            <div className="speaker-detail-layout">
              {speaker.profileImage ? (
                <img src={speaker.profileImage} alt={speaker.name} className="speaker-photo speaker-detail-photo" />
              ) : (
                <div className="speaker-photo speaker-photo-placeholder speaker-detail-photo" aria-hidden="true">
                  {speaker.name.charAt(0)}
                </div>
              )}
              <div>
                <h1>{speaker.name}</h1>
                {(speaker.designation || speaker.organization) && (
                  <p className="speaker-role">
                    {speaker.designation}
                    {speaker.designation && speaker.organization ? ' · ' : ''}
                    {speaker.organization}
                  </p>
                )}
                {speaker.bio && <p className="session-description">{speaker.bio}</p>}
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

                {theirSessions.length > 0 && (
                  <div className="session-detail-related">
                    <h2>Sessions</h2>
                    <ul className="dashboard-links">
                      {theirSessions.map((s) => (
                        <li key={s.id}>
                          <Link to={`/sessions/${s.id}`}>{s.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </article>
        )}
      </PageContainer>
    </div>
  );
}
