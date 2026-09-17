import { Link } from 'react-router-dom';
import { PastEventGrid } from '../components/past-events/PastEventGrid.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

export function PastEventsPage() {
  useDocumentHead({
    title: 'Past Events',
    description: "A look back at previous AWS Student Community Day editions at Ganpat University.",
  });

  return (
    <div>
      <div className="page-hero" style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--scd-border)' }}>
        <PageContainer>
          <p className="mo" style={{ color: 'var(--scd-muted)', marginBottom: '8px' }}>
            09 / Past editions
          </p>
          <h1 className="d1" style={{ fontSize: '36px', marginBottom: '8px' }}>
            We&apos;ve done this before
          </h1>
          <p className="tx" style={{ fontSize: '14px', maxWidth: '640px' }}>
            A look back at previous AWS Student Community Day editions, student projects, and milestones.
          </p>
        </PageContainer>
      </div>

      <div className="section" style={{ padding: '32px 0 60px' }}>
        <PageContainer>
          <div className="c" style={{ gap: '32px' }}>
            {/* 3 StatCards with big display numerals from wireframe 1k */}
            <div className="c" style={{ gap: '8px' }}>
              <div className="r" style={{ gap: '16px', flexWrap: 'wrap' }}>
                <div
                  className="k"
                  style={{
                    flex: '1 1 180px',
                    alignItems: 'center',
                    padding: '20px 16px',
                    textAlign: 'center',
                    background: 'var(--scd-surface)',
                  }}
                >
                  <p className="d1" style={{ fontSize: '40px', color: 'var(--scd-primary)', margin: 0 }}>
                    480
                  </p>
                  <p className="mo" style={{ color: 'var(--scd-muted)', marginTop: '4px' }}>
                    Attendees
                  </p>
                </div>

                <div
                  className="k"
                  style={{
                    flex: '1 1 180px',
                    alignItems: 'center',
                    padding: '20px 16px',
                    textAlign: 'center',
                    background: 'var(--scd-surface)',
                  }}
                >
                  <p className="d1" style={{ fontSize: '40px', color: 'var(--scd-primary)', margin: 0 }}>
                    14
                  </p>
                  <p className="mo" style={{ color: 'var(--scd-muted)', marginTop: '4px' }}>
                    Sessions
                  </p>
                </div>

                <div
                  className="k"
                  style={{
                    flex: '1 1 180px',
                    alignItems: 'center',
                    padding: '20px 16px',
                    textAlign: 'center',
                    background: 'var(--scd-surface)',
                  }}
                >
                  <p className="d1" style={{ fontSize: '40px', color: 'var(--scd-primary)', margin: 0 }}>
                    22
                  </p>
                  <p className="mo" style={{ color: 'var(--scd-muted)', marginTop: '4px' }}>
                    Colleges
                  </p>
                </div>
              </div>
              <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>
                Historical figures across previous editions · Verified student attendance
              </p>
            </div>

            {/* Past editions list */}
            <div className="c" style={{ gap: '16px' }}>
              <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="d2" style={{ fontSize: '24px', margin: 0 }}>Previous editions</h2>
                <Link to="/gallery" className="btn g" style={{ fontSize: '11px', textDecoration: 'none' }}>
                  Browse photo gallery →
                </Link>
              </div>
              <PastEventGrid />
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
