import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { formatDateTime, statusTone } from '../lib/format.js';
import { Badge } from '../components/ui/Badge.js';
import { useDocumentHead } from '../lib/seo.js';

interface MeData {
  user: PublicUser;
  attendee: Attendee | null;
}

/** Shared "this section failed to load" fallback — every dashboard card renders
 * its own error state instead of silently showing nothing, per the platform's
 * "every page must have an error state" requirement. */
function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="status-line form-error">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn-link" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** The PDF endpoints return a raw application/pdf body (not the JSON
 * envelope), so they need their own authenticated fetch rather than apiClient. */
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
  const { data: me, loading: meLoading, error: meError, reload: reloadMe } = useResource<MeData>('/me');
  const {
    data: registration,
    loading: regLoading,
    error: regError,
    reload: reloadRegistration,
  } = useResource<Registration>('/me/registration');
  const {
    data: ticket,
    error: ticketError,
    reload: reloadTicket,
  } = useResource<Ticket>('/me/ticket', Boolean(registration));
  const {
    items: certificates,
    loading: certificatesLoading,
    error: certificatesError,
    reload: reloadCertificates,
  } = useResource<Certificate>('/me/certificates');
  const {
    items: achievements,
    loading: achievementsLoading,
    error: achievementsError,
    reload: reloadAchievements,
  } = useResource<unknown>('/me/achievements');
  const { data: event } = useResource<EventConfig>('/event');

  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Wireframe 1h "Hey Riya. / 18 days to go." greeting -- real event date,
  // never shown once the event has already happened.
  const firstName = me?.attendee?.fullName.split(' ')[0];
  const daysToGo = event ? Math.ceil((new Date(event.eventDate).getTime() - Date.now()) / 86400000) : null;

  useDocumentHead({ title: 'My Dashboard' });

  return (
    <div className="page-section dashboard">
      <header className="page-section-header">
        <h1>{firstName ? `Hey ${firstName}.` : 'My dashboard'}</h1>
        {!meLoading && !meError && me?.attendee && (
          <p className="page-section-lede">
            {daysToGo !== null && daysToGo > 0 ? `${daysToGo} day${daysToGo === 1 ? '' : 's'} to go. ` : ''}
            {me.attendee.fullName}
            {me.attendee.university ? ` · ${me.attendee.university}` : ''}
          </p>
        )}
        {!meLoading && meError && <SectionError message={meError} onRetry={reloadMe} />}
      </header>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>Event registration</h2>
          {regLoading ? (
            <p className="status-line">Loading…</p>
          ) : regError ? (
            <SectionError message={regError} onRetry={reloadRegistration} />
          ) : registration ? (
            <>
              <p className="dashboard-card-row">
                <Badge tone={statusTone(registration.status)}>{registration.status}</Badge>
                <span className="dashboard-card-meta">#{registration.registrationNumber}</span>
              </p>
              {registration.ticketPlan && (
                <p className="dashboard-card-meta">
                  {registration.ticketPlan.name} — {registration.ticketPlan.currency} {registration.ticketPlan.price}
                </p>
              )}
              {registration.confirmedAt && (
                <p className="status-line">Confirmed {formatDateTime(registration.confirmedAt)}.</p>
              )}
            </>
          ) : (
            // The dashboard route guard (App.tsx's RequireConfirmedRegistration)
            // only lets a CONFIRMED registration through, so this is
            // unreachable in practice -- kept as an honest fallback rather
            // than assuming the guard can never change.
            <p className="status-line">No confirmed registration found.</p>
          )}
        </section>

        <section className="dashboard-card">
          <h2>Ticket</h2>
          {ticketError ? (
            <SectionError message={ticketError} onRetry={reloadTicket} />
          ) : ticket ? (
            <>
              <p className="dashboard-card-row">
                <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
                <span className="dashboard-card-meta">#{ticket.ticketNumber}</span>
              </p>
              <p className="status-line">Issued {formatDateTime(ticket.issuedAt)}.</p>
              {ticket.pdfAvailable ? (
                <button
                  type="button"
                  className="btn-link"
                  onClick={() =>
                    downloadOwnPdf('/me/ticket/pdf', `ticket-${ticket.ticketNumber}.pdf`).catch((err) =>
                      setDownloadError(err instanceof Error ? err.message : 'Failed to download the ticket PDF.'),
                    )
                  }
                >
                  Download ticket PDF
                </button>
              ) : (
                <p className="form-help">Your ticket PDF is still being generated — check back shortly.</p>
              )}
              {downloadError && <p className="form-error">{downloadError}</p>}
            </>
          ) : (
            <p className="status-line">
              Your ticket will appear here once your registration is confirmed.
            </p>
          )}
        </section>

        <section className="dashboard-card">
          <h2>Certificates</h2>
          {certificatesLoading ? (
            <p className="status-line">Loading…</p>
          ) : certificatesError ? (
            <SectionError message={certificatesError} onRetry={reloadCertificates} />
          ) : certificates.length === 0 ? (
            <p className="status-line">No certificates yet — these are issued after the event.</p>
          ) : (
            <ul className="checkpoint-list">
              {certificates.map((c) => (
                <li key={c.id}>
                  {c.title} <span className="dashboard-card-meta">#{c.certificateNumber}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card">
          <h2>Achievements</h2>
          {achievementsLoading ? (
            <p className="status-line">Loading…</p>
          ) : achievementsError ? (
            <SectionError message={achievementsError} onRetry={reloadAchievements} />
          ) : (
            <p className="status-line">
              {achievements.length === 0
                ? 'No achievements unlocked yet.'
                : `${achievements.length} unlocked.`}
            </p>
          )}
          <Link to="/dashboard/achievements" className="btn-link">
            View achievements →
          </Link>
        </section>

        <section className="dashboard-card">
          <h2>Create My SCD Post</h2>
          <p className="status-line">Generate a LinkedIn post and Instagram caption for attending the event.</p>
          <Link to="/dashboard/social-post" className="btn-link">
            Create my post →
          </Link>
        </section>

        <section className="dashboard-card">
          <h2>Quick links</h2>
          <ul className="dashboard-links">
            <li><Link to="/dashboard/profile">My profile</Link></li>
            <li><Link to="/dashboard/achievements">Achievements</Link></li>
            <li><Link to="/dashboard/certificates">Certificates</Link></li>
            <li><Link to="/dashboard/wrapped">Event wrapped</Link></li>
            <li><Link to="/dashboard/social-post">Create my SCD post</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
