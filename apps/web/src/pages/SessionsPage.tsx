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
      <div className="page-hero">
        <PageContainer>
          <h1>Sessions</h1>
          <p>Talks, workshops, and panels happening this year.</p>
        </PageContainer>
      </div>
      <div className="section">
        <PageContainer>
          <SessionGrid filterable />
        </PageContainer>
      </div>
    </div>
  );
}
