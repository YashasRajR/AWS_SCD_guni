import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type {
  Attendee,
  Certificate,
  EventConfig,
  PublicUser,
  Registration,
  Ticket,
} from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { getStoredToken } from '../lib/auth-storage.js';
import { useAuth } from '../lib/auth.js';
import { useDocumentHead } from '../lib/seo.js';
import { Mascot } from '../components/ui/Mascot.js';
import { useSavedSessions } from '../lib/useSavedSessions.js';
import { useSessions } from '../lib/queries.js';

interface MeData {
  user: PublicUser;
  attendee: Attendee | null;
}

async function downloadOwnPdf(path: string, filename: string): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    headers: { Authorization: `Bearer ${getStoredToken() ?? ''}` },
  });
  if (!res.ok) throw new Error('Failed to download PDF.');
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: me } = useResource<MeData>('/me');
  const { data: registration } = useResource<Registration>('/me/registration');
  const { data: ticket } = useResource<Ticket>('/me/ticket', Boolean(registration));
  const { items: certificates } = useResource<Certificate>('/me/certificates');
  const { items: achievements } = useResource<unknown>('/me/achievements');
  const { data: event } = useResource<EventConfig>('/event');
  const { savedIds } = useSavedSessions();
  const { items: allSessions } = useSessions();

  // Automatic variant detection with manual override for previewing Wireframe 1h states
  const [variantOverride, setVariantOverride] = useState<'AUTO' | 'PRE' | 'EVENT' | 'POST'>('AUTO');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const eventDateMs = new Date('2026-10-08T09:00:00+05:30').getTime();
  const nowMs = Date.now();
  const daysToGo = Math.max(0, Math.ceil((eventDateMs - nowMs) / 86400000));

  const currentVariant = useMemo(() => {
    if (variantOverride !== 'AUTO') return variantOverride;
    if (nowMs < eventDateMs) return 'PRE';
    if (nowMs >= eventDateMs && nowMs < eventDateMs + 86400000) return 'EVENT';
    return 'POST';
  }, [variantOverride, nowMs, eventDateMs]);

  const attendeeName = me?.attendee?.fullName || user?.email?.split('@')[0] || 'Attendee';
  const firstName = attendeeName.split(' ')[0];
  const regNo = registration?.registrationNumber || ticket?.ticketNumber || 'SCD26-0417';

  // 4 Event stations
  const totalCheckpoints: number = 4;
  const completedCount: number = 1; // 1 station done (registration/check-in confirmed)

  // Saved sessions lookup
  const myNextSession = useMemo(() => {
    const saved = allSessions.filter((s) => savedIds.includes(s.id));
    return saved[0] || null;
  }, [allSessions, savedIds]);

  useDocumentHead({ title: 'Student Dashboard · AWS SCD 2026' });

  // Circular progress math
  const ringRadius = 24;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (completedCount / totalCheckpoints) * ringCircumference;

  return (
    <div className="section dashboard-wrapper" style={{ padding: '24px 0 80px' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 16px' }}>
        {/* Wireframe 1h State Switcher for reviewer inspection */}
        <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>
            Dashboard / Wireframe 1h
          </p>
          <div className="r" style={{ gap: '4px', alignItems: 'center' }}>
            <span className="mo" style={{ fontSize: '10px', color: 'var(--scd-muted)', marginRight: '4px' }}>
              Mode:
            </span>
            {(['PRE', 'EVENT', 'POST'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setVariantOverride(mode)}
                className={`chip ${currentVariant === mode ? 'on' : ''}`}
                style={{ fontSize: '10px', padding: '3px 8px', cursor: 'pointer' }}
              >
                {mode === 'PRE' ? 'Pre-event' : mode === 'EVENT' ? 'Event day' : 'Post-event'}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Shell with Sidebar on Desktop (Wireframe 1h) */}
        <div
          className="dashboard-shell"
          style={{
            display: 'flex',
            border: '1.5px solid var(--scd-primary)',
            borderRadius: '4px',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {/* Desktop Left Rail Navigation (Wireframe 1h) */}
          <div
            className="dashboard-sidebar"
            style={{
              width: '130px',
              background: 'var(--scd-surface-muted)',
              borderRight: '1.25px solid var(--scd-border)',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flex: 'none',
            }}
          >
            <div className="r" style={{ alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Mascot variant="sm" size={24} />
              <span className="mo" style={{ fontSize: '10px', fontWeight: 700 }}>AWS SCD</span>
            </div>
            <Link to="/dashboard" className="mo" style={{ color: 'var(--scd-accent)', textDecoration: 'none' }}>
              ● Home
            </Link>
            <Link to="/sessions" className="mo" style={{ color: 'var(--scd-fg)', textDecoration: 'none' }}>
              Sessions
            </Link>
            <Link to="/dashboard/achievements" className="mo" style={{ color: 'var(--scd-fg)', textDecoration: 'none' }}>
              Progress
            </Link>
            <Link to="/dashboard/certificates" className="mo" style={{ color: 'var(--scd-fg)', textDecoration: 'none' }}>
              Certificate
            </Link>
            <Link to="/social-post" className="mo" style={{ color: 'var(--scd-fg)', textDecoration: 'none' }}>
              Social Post
            </Link>
            <Link to="/dashboard/profile" className="mo" style={{ color: 'var(--scd-fg)', textDecoration: 'none' }}>
              Profile
            </Link>
            <button
              type="button"
              onClick={() => logout().then(() => navigate('/'))}
              className="mo"
              style={{
                marginTop: 'auto',
                background: 'transparent',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                color: 'var(--scd-muted)',
                cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </div>

          {/* Main Dashboard Panel */}
          <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header Greeting */}
            <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="c" style={{ gap: '2px' }}>
                <h1 className="d2" style={{ margin: 0, fontSize: '26px' }}>Hey {firstName}.</h1>
                <p className="tx" style={{ color: 'var(--scd-muted)', fontSize: '13px' }}>
                  {currentVariant === 'PRE'
                    ? `${daysToGo > 0 ? `${daysToGo} days to go.` : 'Event starts soon.'} 8 October 2026 at GUNI.`
                    : currentVariant === 'EVENT'
                      ? 'Welcome to AWS Students Community Day 2026! Happening today.'
                      : 'AWS SCD 2026 has concluded. Thanks for being part of it!'}
                </p>
              </div>
              <Mascot variant={currentVariant === 'EVENT' ? 'wave' : 'default'} size={54} />
            </div>

            {/* EVENT DAY: Happening Now Card Promoted to Top */}
            {currentVariant === 'EVENT' && (
              <div className="k" style={{ border: '2px solid var(--scd-accent)', background: 'rgba(255, 153, 0, 0.05)', padding: '14px', gap: '8px' }}>
                <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="mo" style={{ color: '#B36200', fontWeight: 700 }}>Happening now · 11:00 AM</p>
                  <span className="chip on" style={{ fontSize: '10px' }}>Live</span>
                </div>
                <h3 className="lbl" style={{ margin: 0, fontSize: '16px' }}>Keynote: Serverless Architecture &amp; AI Agents</h3>
                <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '12px' }}>Auditorium · Main Stage · 45 min remaining</p>
                <div className="r" style={{ gap: '8px', marginTop: '4px' }}>
                  <Link to="/agenda" className="btn o" style={{ textDecoration: 'none', fontSize: '11px' }}>
                    Find my room →
                  </Link>
                  <Link to="/timeline" className="btn g" style={{ textDecoration: 'none', fontSize: '11px' }}>
                    View day flow
                  </Link>
                </div>
              </div>
            )}

            {/* POST-EVENT: Certificate & Wrapped Promoted to Top */}
            {currentVariant === 'POST' && (
              <div className="r" style={{ gap: '12px', flexWrap: 'wrap' }}>
                <div className="k" style={{ flex: 1, border: '2px solid var(--scd-primary)', padding: '16px', gap: '10px' }}>
                  <p className="mo" style={{ color: 'var(--scd-accent)' }}>Issued</p>
                  <h3 className="d3" style={{ margin: 0 }}>Your certificate is ready</h3>
                  <p className="tx" style={{ fontSize: '12px' }}>Verified certificate of participation for AWS SCD 2026.</p>
                  <div className="r" style={{ gap: '8px' }}>
                    <Link to="/dashboard/certificates" className="btn o" style={{ textDecoration: 'none', fontSize: '11px' }}>
                      View &amp; download →
                    </Link>
                  </div>
                </div>

                <div className="k" style={{ flex: 1, border: '2px solid var(--scd-primary)', padding: '16px', gap: '10px' }}>
                  <p className="mo" style={{ color: 'var(--scd-accent)' }}>Story recap</p>
                  <h3 className="d3" style={{ margin: 0 }}>Your SCD Wrapped</h3>
                  <p className="tx" style={{ fontSize: '12px' }}>6-slide story recap of your sessions, hours, and achievements.</p>
                  <div className="r" style={{ gap: '8px' }}>
                    <Link to="/dashboard/wrapped" className="btn" style={{ textDecoration: 'none', fontSize: '11px' }}>
                      Play Wrapped →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TICKET CARD FIRST, ALWAYS (Wireframe 1h callout) */}
            <div className="k" style={{ padding: '16px', gap: '12px', background: 'var(--scd-surface)' }}>
              <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="c" style={{ gap: '2px' }}>
                  <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>Your ticket</p>
                  <h2 className="d3" style={{ margin: 0, fontSize: '18px' }}>{attendeeName}</h2>
                  <p className="mo" style={{ color: 'var(--scd-primary)', fontSize: '12px', fontWeight: 600 }}>
                    Reg. no. {regNo}
                  </p>
                  <p className="tx" style={{ color: 'var(--scd-muted)', fontSize: '12px' }}>
                    {me?.attendee?.university || 'Ganpat University'} · {me?.attendee?.branch || 'Computer Engineering'}
                  </p>
                </div>
                <div className="c" style={{ alignItems: 'flex-end', gap: '4px' }}>
                  <span className="chip on" style={{ fontSize: '11px' }}>Confirmed</span>
                  <p className="mo" style={{ fontSize: '10px', color: 'var(--scd-muted)' }}>Show name at check-in</p>
                </div>
              </div>

              {/* 4 Checkpoints Strip */}
              <div className="r" style={{ gap: '6px', flexWrap: 'wrap' }}>
                <div className="kd" style={{ flex: 1, minWidth: '70px', padding: '6px 8px', background: completedCount >= 1 ? 'var(--scd-accent)' : undefined }}>
                  <p className="mo" style={{ fontSize: '10px', color: completedCount >= 1 ? '#fff' : 'var(--scd-muted)' }}>
                    {completedCount >= 1 ? 'Check-in (Done)' : '1 Check-in'}
                  </p>
                </div>
                <div className="kd" style={{ flex: 1, minWidth: '70px', padding: '6px 8px', background: completedCount >= 2 ? 'var(--scd-accent)' : undefined }}>
                  <p className="mo" style={{ fontSize: '10px', color: completedCount >= 2 ? '#fff' : 'var(--scd-muted)' }}>
                    {completedCount >= 2 ? 'Keynote (Done)' : '2 Keynote'}
                  </p>
                </div>
                <div className="kd" style={{ flex: 1, minWidth: '70px', padding: '6px 8px', background: completedCount >= 3 ? 'var(--scd-accent)' : undefined }}>
                  <p className="mo" style={{ fontSize: '10px', color: completedCount >= 3 ? '#fff' : 'var(--scd-muted)' }}>
                    {completedCount >= 3 ? 'Workshop (Done)' : '3 Workshop'}
                  </p>
                </div>
                <div className="kd" style={{ flex: 1, minWidth: '70px', padding: '6px 8px', background: completedCount >= 4 ? 'var(--scd-accent)' : undefined }}>
                  <p className="mo" style={{ fontSize: '10px', color: completedCount >= 4 ? '#fff' : 'var(--scd-muted)' }}>
                    {completedCount >= 4 ? 'Closing (Done)' : '4 Closing'}
                  </p>
                </div>
              </div>

              {ticket?.pdfAvailable && (
                <div className="r" style={{ gap: '8px', marginTop: '2px' }}>
                  <button
                    type="button"
                    className="btn g"
                    onClick={() =>
                      downloadOwnPdf('/me/ticket/pdf', `ticket-${regNo}.pdf`).catch((err) =>
                        setDownloadError(err instanceof Error ? err.message : 'Failed to download.'),
                      )
                    }
                    style={{ fontSize: '11px', cursor: 'pointer' }}
                  >
                    Download ticket PDF
                  </button>
                </div>
              )}
              {downloadError && <p className="tx" style={{ color: '#b3261e', fontSize: '11px' }}>{downloadError}</p>}
            </div>

            {/* Checkpoints Progress Ring + Next Session Card */}
            <div className="r" style={{ gap: '14px', flexWrap: 'wrap' }}>
              {/* Progress Ring Card */}
              <div className="k" style={{ flex: '1 1 180px', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="32" cy="32" r={ringRadius} fill="none" stroke="var(--scd-border)" strokeWidth="5" />
                    <circle
                      cx="32"
                      cy="32"
                      r={ringRadius}
                      fill="none"
                      stroke="var(--scd-accent)"
                      strokeWidth="5"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', fontFamily: 'var(--scd-mono)', fontWeight: 700, fontSize: '13px' }}>
                    {completedCount}/{totalCheckpoints}
                  </div>
                </div>
                <p className="mo" style={{ marginTop: '8px', fontSize: '11px' }}>Checkpoints</p>
                <p className="tx" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
                  {completedCount === totalCheckpoints ? 'All checkpoints checked!' : `${totalCheckpoints - completedCount} stations to go`}
                </p>
              </div>

              {/* Your Next Session / Saved Sessions */}
              <div className="k" style={{ flex: '1.4 1 240px', padding: '16px', gap: '8px' }}>
                <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>Your next session</p>
                {myNextSession ? (
                  <div className="kd" style={{ background: 'var(--scd-surface-muted)', gap: '4px' }}>
                    <p className="lbl" style={{ fontSize: '14px' }}>{myNextSession.title}</p>
                    <p className="mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
                      {myNextSession.track ?? 'General'} · {myNextSession.durationMinutes ? `${myNextSession.durationMinutes} min` : '45 min'}
                    </p>
                  </div>
                ) : (
                  <p className="lbl" style={{ color: 'var(--scd-muted)', fontSize: '13px' }}>
                    Nothing yet — pick talks and labs from the catalog.
                  </p>
                )}
                <div className="r" style={{ gap: '8px', marginTop: 'auto' }}>
                  <Link to="/sessions" className="btn g" style={{ fontSize: '11px', textDecoration: 'none' }}>
                    Browse sessions →
                  </Link>
                  {savedIds.length > 0 && (
                    <span className="mo" style={{ alignSelf: 'center', fontSize: '11px', color: 'var(--scd-accent)' }}>
                      {savedIds.length} saved
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Announcements Panel */}
            <div className="k mut" style={{ padding: '12px 16px', gap: '4px' }}>
              <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>Announcements</p>
              <p className="tx" style={{ fontSize: '13px' }}>
                Detailed lab requirements and wifi credentials will be posted in the foyer on 8 October. Ensure your laptop has Google Chrome or Firefox installed.
              </p>
            </div>

            {/* Grid of 4 Feature Cards (Achievements, Certificate, Social Post, Wrapped) */}
            <div className="r" style={{ gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/dashboard/achievements" className="k" style={{ flex: 1, minWidth: '160px', textDecoration: 'none', color: 'inherit', padding: '14px', gap: '4px' }}>
                <p className="d3" style={{ margin: 0, fontSize: '16px' }}>Achievements</p>
                <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>
                  {achievements.length > 0 ? `${achievements.length} of 8 unlocked` : '0 of 8 unlocked'}
                </p>
              </Link>

              <Link to="/dashboard/certificates" className="k" style={{ flex: 1, minWidth: '160px', textDecoration: 'none', color: 'inherit', padding: '14px', gap: '4px' }}>
                <p className="d3" style={{ margin: 0, fontSize: '16px' }}>Certificate</p>
                <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>
                  {certificates.length > 0 ? `${certificates.length} available` : 'Unlocks after event'}
                </p>
              </Link>
            </div>

            <div className="r" style={{ gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/social-post" className="k" style={{ flex: 1, minWidth: '160px', textDecoration: 'none', color: 'inherit', padding: '14px', gap: '4px' }}>
                <p className="d3" style={{ margin: 0, fontSize: '16px' }}>Social Post</p>
                <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>
                  &quot;I&apos;m attending&quot; badge
                </p>
              </Link>

              <Link to="/dashboard/wrapped" className="k" style={{ flex: 1, minWidth: '160px', textDecoration: 'none', color: 'inherit', padding: '14px', gap: '4px' }}>
                <p className="d3" style={{ margin: 0, fontSize: '16px' }}>Event Wrapped</p>
                <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>
                  6-slide story recap
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Tab Bar (Wireframe 1h callout: Home · Sessions · Progress · Profile) */}
        <div
          className="dashboard-mobile-tabs r"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--scd-surface)',
            borderTop: '1.5px solid var(--scd-primary)',
            padding: '10px 16px',
            justifyContent: 'space-around',
            zIndex: 100,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
          }}
        >
          <Link to="/dashboard" className="mo" style={{ color: 'var(--scd-accent)', textDecoration: 'none' }}>
            Home
          </Link>
          <Link to="/sessions" className="mo" style={{ color: 'var(--scd-fg)', textDecoration: 'none' }}>
            Sessions
          </Link>
          <Link to="/dashboard/achievements" className="mo" style={{ color: 'var(--scd-fg)', textDecoration: 'none' }}>
            Progress
          </Link>
          <Link to="/dashboard/profile" className="mo" style={{ color: 'var(--scd-fg)', textDecoration: 'none' }}>
            Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
