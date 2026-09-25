import { Link, useParams } from 'react-router-dom';
import { useSessions, useSpeakers, useAgenda } from '../lib/queries.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { SkeletonText } from '../components/ui/Skeleton.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { ExternalLinkIcon } from '../components/ui/Icon.js';
import { useDocumentHead } from '../lib/seo.js';
import { formatTime } from '../lib/format.js';

export function SpeakerDetailPage() {
  const { id } = useParams();
  const { items: speakers, loading, error, reload } = useSpeakers();
  const { items: sessions } = useSessions();
  const { items: agenda } = useAgenda();

  const speaker = speakers.find((s) => s.id === id);
  const theirSessions = speaker ? sessions.filter((s) => s.speakers?.some((sp) => sp.id === speaker.id)) : [];

  useDocumentHead({ title: speaker ? speaker.name : 'Speaker' });

  return (
    <div className="section" style={{ padding: '32px 0 60px' }}>
      <PageContainer>
        <p className="mo" style={{ color: 'var(--scd-muted)', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> /{' '}
          <Link to="/speakers" style={{ color: 'inherit', textDecoration: 'none' }}>Speakers</Link> /{' '}
          <span style={{ color: 'var(--scd-fg)' }}>{speaker?.name ?? '…'}</span>
        </p>

        {loading && <SkeletonText lines={6} />}
        {error && <ErrorState onRetry={reload} />}

        {!loading && !error && !speaker && (
          <EmptyState
            message="This speaker couldn't be found."
            action={
              <Link to="/speakers" className="btn o" style={{ textDecoration: 'none' }}>
                Back to all speakers
              </Link>
            }
          />
        )}

        {speaker && (
          <article className="c" style={{ gap: '24px', maxWidth: '840px' }}>
            <div className="r" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
              {/* Sticky portrait column */}
              <div className="c" style={{ width: '180px', flex: 'none', position: 'sticky', top: '90px', gap: '10px' }}>
                <div
                  style={{
                    aspectRatio: '4/5',
                    width: '100%',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: '1.25px solid var(--scd-border)',
                    background: 'var(--scd-surface-muted)',
                  }}
                >
                  {speaker.profileImage ? (
                    <img
                      src={speaker.profileImage}
                      alt={speaker.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="speaker-photo-placeholder"
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        fontWeight: 800,
                        fontFamily: 'var(--scd-mono)',
                        background: 'repeating-linear-gradient(45deg, #e6e2da 0 6px, #f4f1eb 6px 12px)',
                        color: 'var(--scd-primary)',
                      }}
                    >
                      {speaker.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Social chips */}
                <div className="r" style={{ gap: '6px', flexWrap: 'wrap' }}>
                  {speaker.linkedinUrl && (
                    <a
                      href={speaker.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="chip on"
                      style={{ fontSize: '10px', textDecoration: 'none' }}
                    >
                      in <ExternalLinkIcon width={10} height={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </a>
                  )}
                  {speaker.websiteUrl && (
                    <a
                      href={speaker.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="chip"
                      style={{ fontSize: '10px', textDecoration: 'none' }}
                    >
                      web <ExternalLinkIcon width={10} height={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </a>
                  )}
                </div>
              </div>

              {/* Speaker bio & details column */}
              <div className="c" style={{ flex: '1 1 340px', gap: '14px' }}>
                <div>
                  <h1 className="d1" style={{ fontSize: '32px', margin: '0 0 4px' }}>
                    {speaker.name}
                  </h1>
                  {(speaker.designation || speaker.organization) && (
                    <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '13px' }}>
                      {[speaker.designation, speaker.organization].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>

                <hr className="rule" style={{ width: '50px', height: '2px', background: 'var(--scd-accent)', border: 0, margin: 0 }} />

                {speaker.bio ? (
                  <p className="tx" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                    {speaker.bio}
                  </p>
                ) : (
                  <p className="tx" style={{ color: 'var(--scd-muted)', fontStyle: 'italic' }}>
                    Bio will be updated as sessions are finalized.
                  </p>
                )}

                {/* Sessions list */}
                <div className="k" style={{ gap: '10px', marginTop: '12px', background: 'var(--scd-surface)' }}>
                  <p className="mo" style={{ color: 'var(--scd-muted)' }}>Sessions by {speaker.name}</p>
                  {theirSessions.length > 0 ? (
                    <div className="c" style={{ gap: '8px' }}>
                      {theirSessions.map((s) => {
                        const slot = agenda.find((a) => a.sessionId === s.id);
                        return (
                          <div key={s.id} className="kd" style={{ background: 'var(--scd-surface-muted)', gap: '4px' }}>
                            <Link
                              to={`/sessions/${s.id}`}
                              className="lbl"
                              style={{ textDecoration: 'none', color: 'var(--scd-fg)', fontSize: '14px' }}
                            >
                              {s.title} →
                            </Link>
                            <p className="mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
                              {slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)} · ` : ''}
                              {s.track ?? 'General'}
                              {s.durationMinutes ? ` · ${s.durationMinutes} min` : ''}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="tx" style={{ color: 'var(--scd-muted)' }}>
                      No sessions scheduled yet. Check back soon.
                    </p>
                  )}
                </div>

                <div style={{ marginTop: '12px' }}>
                  <Link to="/speakers" className="btn g" style={{ textDecoration: 'none' }}>
                    ← Back to all speakers
                  </Link>
                </div>
              </div>
            </div>
          </article>
        )}
      </PageContainer>
    </div>
  );
}
