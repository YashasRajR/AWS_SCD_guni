import { SessionGrid } from '../components/sessions/SessionGrid.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

export function SessionsPage() {
  useDocumentHead({
    title: 'Sessions',
    description: 'Talks, workshops, and panels happening at AWS Student Community Day 2026.',
  });

  return (
    <div>
      <div className="page-hero" style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--scd-border)' }}>
        <PageContainer>
          <h1 className="d1" style={{ fontSize: '36px', marginBottom: '8px' }}>
            Sessions &amp; workshops
          </h1>
          <p className="tx" style={{ fontSize: '14px', maxWidth: '640px' }}>
            Pick a level, pick a topic. Every session is free to attend.
          </p>
        </PageContainer>
      </div>
      <div className="section" style={{ padding: '32px 0 60px' }}>
        <PageContainer>
          <SessionGrid filterable />
        </PageContainer>
      </div>
    </div>
  );
}
