import { Link } from 'react-router-dom';
import type { Speaker } from '@scd/types';
import { useAgenda, useSessions } from '../../lib/queries.js';
import { formatTime } from '../../lib/format.js';
import { ExternalLinkIcon } from '../ui/Icon.js';
import { SlideOver } from '../ui/SlideOver.js';

/**
 * The full speaker-detail view (same content as SpeakerDetailPage),
 * shown as a right-edge SlideOver from a card click instead of a route
 * change -- /speakers/:id still works standalone for direct links.
 */
export function SpeakerDetailOverlay({ speaker, onClose }: { speaker: Speaker | null; onClose: () => void }) {
  const { items: sessions } = useSessions();
  const { items: agenda } = useAgenda();

  const theirSessions = speaker ? sessions.filter((s) => s.speakers?.some((sp) => sp.id === speaker.id)) : [];

  return (
    <SlideOver open={speaker !== null} onClose={onClose} title={speaker?.name}>
      {speaker && (
        <article className="c" style={{ gap: '20px' }}>
          <div
            style={{
              aspectRatio: '4/5',
              width: '180px',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1.25px solid var(--border)',
              background: 'var(--surface-muted)',
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
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  background: 'repeating-linear-gradient(45deg, #e6e2da 0 6px, #f4f1eb 6px 12px)',
                  color: 'var(--primary)',
                }}
              >
                {speaker.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="r" style={{ gap: '6px', flexWrap: 'wrap' }}>
            {speaker.linkedinUrl && (
              <a href={speaker.linkedinUrl} target="_blank" rel="noreferrer" className="chip on" style={{ fontSize: '10px', textDecoration: 'none' }}>
                in <ExternalLinkIcon width={10} height={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </a>
            )}
            {speaker.websiteUrl && (
              <a href={speaker.websiteUrl} target="_blank" rel="noreferrer" className="chip" style={{ fontSize: '10px', textDecoration: 'none' }}>
                ↗ web
              </a>
            )}
          </div>

          <div>
            <h1 className="d1" style={{ fontSize: '28px', margin: '0 0 4px' }}>
              {speaker.name}
            </h1>
            {(speaker.designation || speaker.organization) && (
              <p className="mo" style={{ color: 'var(--muted)', fontSize: '13px' }}>
                {[speaker.designation, speaker.organization].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <hr className="rule" style={{ width: '50px', height: '2px', background: 'var(--accent)', border: 0, margin: 0 }} />

          {speaker.bio ? (
            <p className="tx" style={{ fontSize: '14px', lineHeight: 1.6 }}>{speaker.bio}</p>
          ) : (
            <p className="tx" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
              Bio will be updated as sessions are finalized.
            </p>
          )}

          <div className="k" style={{ gap: '10px', background: 'var(--surface)' }}>
            <p className="mo" style={{ color: 'var(--muted)' }}>Sessions by {speaker.name}</p>
            {theirSessions.length > 0 ? (
              <div className="c" style={{ gap: '8px' }}>
                {theirSessions.map((s) => {
                  const slot = agenda.find((a) => a.sessionId === s.id);
                  return (
                    <div key={s.id} className="kd" style={{ background: 'var(--surface-muted)', gap: '4px' }}>
                      <Link to={`/sessions/${s.id}`} className="lbl" style={{ textDecoration: 'none', color: 'var(--foreground)', fontSize: '14px' }} onClick={onClose}>
                        {s.title} →
                      </Link>
                      <p className="mo" style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {slot ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)} · ` : ''}
                        {s.track ?? 'General'}
                        {s.durationMinutes ? ` · ${s.durationMinutes} min` : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="tx" style={{ color: 'var(--muted)' }}>No sessions scheduled yet. Check back soon.</p>
            )}
          </div>

          <Link to={`/speakers/${speaker.id}`} className="btn g" style={{ textDecoration: 'none', alignSelf: 'flex-start' }} onClick={onClose}>
            Open full page →
          </Link>
        </article>
      )}
    </SlideOver>
  );
}
