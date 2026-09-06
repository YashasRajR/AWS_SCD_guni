import { PastEventGrid } from '../components/past-events/PastEventGrid.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

export function PastEventsPage() {
  useDocumentHead({
    title: 'Past Events',
    description: 'A look back at previous AWS Student Community Day editions.',
  });

  return (
    <div>
      <div className="page-hero">
        <PageContainer>
          <h1>Past Events</h1>
          <p>A look back at previous editions.</p>
        </PageContainer>
      </div>
      <div className="section">
        <PageContainer>
          <PastEventGrid />
        </PageContainer>
      </div>
    </div>
  );
}
