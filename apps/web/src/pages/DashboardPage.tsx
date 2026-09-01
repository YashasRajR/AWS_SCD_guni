import { useState } from 'react';
import type { Attendee, Certificate, Checkpoint, PublicUser, Registration, Ticket } from '@scd/types';
import { ApiClientError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { StatusBadge } from '../components/StatusBadge.js';

interface MeData {
  user: PublicUser;
  attendee: Attendee | null;
}

interface ProgressItem {
  checkpoint: Checkpoint;
  completed: boolean;
  completedAt: string | null;
}

export function DashboardPage() {
  const { data: me, loading: meLoading } = useResource<MeData>('/me');
  const {
    data: registration,
    loading: regLoading,
    reload: reloadRegistration,
  } = useResource<Registration>('/me/registration');
  const { data: ticket } = useResource<Ticket>('/me/ticket', Boolean(registration));
  const { items: progress } = useResource<ProgressItem>('/me/progress');
  const { items: certificates } = useResource<Certificate>('/me/certificates');
  const { items: achievements } = useResource<unknown>('/me/achievements');

  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleRegister = async () => {
    setRegistering(true);
    setRegisterError(null);
    try {
      await apiClient.post('/me/registration', {});
      reloadRegistration();
    } catch (err) {
      setRegisterError(err instanceof ApiClientError ? err.message : 'Failed to register.');
    } finally {
      setRegistering(false);
    }
  };

  const completedCount = progress.filter((p) => p.completed).length;

  return (
    <div className="page-section dashboard">
      <header className="page-section-header">
        <h1>My dashboard</h1>
        {!meLoading && me?.attendee && (
          <p className="page-section-lede">
            {me.attendee.fullName}
            {me.attendee.university ? ` · ${me.attendee.university}` : ''}
          </p>
        )}
      </header>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>Event registration</h2>
          {regLoading ? (
            <p className="status-line">Loading…</p>
          ) : registration ? (
            <>
              <p className="dashboard-card-row">
                <StatusBadge status={registration.status} />
                <span className="dashboard-card-meta">#{registration.registrationNumber}</span>
              </p>
              {registration.status === 'PENDING' && (
                <p className="status-line">Your registration is awaiting confirmation from the organizing team.</p>
              )}
              {registration.status === 'CONFIRMED' && registration.confirmedAt && (
                <p className="status-line">Confirmed {formatDateTime(registration.confirmedAt)}.</p>
              )}
              {registration.status === 'WAITLISTED' && (
                <p className="status-line">You&apos;re on the waitlist — we&apos;ll notify you if a spot opens up.</p>
              )}
              {(registration.status === 'CANCELLED' || registration.status === 'REJECTED') && (
                <p className="status-line">
                  This registration was {registration.status.toLowerCase()}. Contact the organizing team with any
                  questions.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="status-line">You haven&apos;t registered for the event yet.</p>
              {registerError && <p className="form-error">{registerError}</p>}
              <button type="button" className="btn btn-primary" onClick={handleRegister} disabled={registering}>
                {registering ? 'Registering…' : 'Register for the event'}
              </button>
            </>
          )}
        </section>

        <section className="dashboard-card">
          <h2>Ticket</h2>
          {ticket ? (
            <>
              <p className="dashboard-card-row">
                <StatusBadge status={ticket.status} />
                <span className="dashboard-card-meta">#{ticket.ticketNumber}</span>
              </p>
              <p className="status-line">Issued {formatDateTime(ticket.issuedAt)}.</p>
            </>
          ) : (
            <p className="status-line">
              Your ticket will appear here once your registration is confirmed.
            </p>
          )}
        </section>

        <section className="dashboard-card">
          <h2>Checkpoint progress</h2>
          {progress.length === 0 ? (
            <p className="status-line">Checkpoints haven&apos;t been set up yet.</p>
          ) : (
            <>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress.length ? (completedCount / progress.length) * 100 : 0}%` }}
                />
              </div>
              <p className="status-line">
                {completedCount} of {progress.length} completed
              </p>
              <ul className="checkpoint-list">
                {progress.map((p) => (
                  <li key={p.checkpoint.id} className={p.completed ? 'checkpoint-done' : ''}>
                    <span>{p.completed ? '✓' : '○'}</span> {p.checkpoint.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="dashboard-card">
          <h2>Certificates</h2>
          {certificates.length === 0 ? (
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
          <p className="status-line">
            {achievements.length === 0
              ? 'No achievements unlocked yet.'
              : `${achievements.length} unlocked.`}
          </p>
        </section>
      </div>
    </div>
  );
}
