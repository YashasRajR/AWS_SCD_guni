import { useResource } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';
import { useDocumentHead } from '../lib/seo.js';
import type { Attendee, PublicUser } from '@scd/types';

interface MeData {
  user: PublicUser;
  attendee: Attendee | null;
}

export function ProfilePage() {
  useDocumentHead({ title: 'My Profile' });
  const { data, loading, error } = useResource<MeData>('/me');

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>My profile</h1>
      </header>

      {loading && <p className="status-line">Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {data && (
        <div className="dashboard-grid">
          <section className="dashboard-card">
            <h2>Account</h2>
            <dl className="profile-list">
              <dt>Email</dt>
              <dd>{data.user.email}</dd>
              <dt>Email verified</dt>
              <dd>{data.user.emailVerifiedAt ? 'Yes' : 'Not yet verified'}</dd>
              <dt>Account status</dt>
              <dd>{data.user.status}</dd>
              <dt>Member since</dt>
              <dd>{formatDateTime(data.user.createdAt)}</dd>
              {data.user.lastLoginAt && (
                <>
                  <dt>Last login</dt>
                  <dd>{formatDateTime(data.user.lastLoginAt)}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="dashboard-card">
            <h2>Attendee profile</h2>
            {data.attendee ? (
              <dl className="profile-list">
                <dt>Full name</dt>
                <dd>{data.attendee.fullName}</dd>
                {data.attendee.phone && (
                  <>
                    <dt>Phone</dt>
                    <dd>{data.attendee.phone}</dd>
                  </>
                )}
                {data.attendee.university && (
                  <>
                    <dt>University</dt>
                    <dd>{data.attendee.university}</dd>
                  </>
                )}
                {data.attendee.department && (
                  <>
                    <dt>Department</dt>
                    <dd>{data.attendee.department}</dd>
                  </>
                )}
                {data.attendee.year && (
                  <>
                    <dt>Year</dt>
                    <dd>{data.attendee.year}</dd>
                  </>
                )}
                {data.attendee.registrationType && (
                  <>
                    <dt>Registration type</dt>
                    <dd>{data.attendee.registrationType}</dd>
                  </>
                )}
                {data.attendee.linkedinUrl && (
                  <>
                    <dt>LinkedIn</dt>
                    <dd>
                      <a href={data.attendee.linkedinUrl} target="_blank" rel="noreferrer">
                        {data.attendee.linkedinUrl}
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            ) : (
              <p className="status-line">No attendee profile found.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
