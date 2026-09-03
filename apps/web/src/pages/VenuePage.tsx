import { VenueGrid } from '../components/venues/VenueGrid.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

export function VenuePage() {
  useDocumentHead({
    title: 'Venue',
    description: 'Where to find each room and space at AWS Student Community Day 2026.',
  });

  return (
    <div>
      <div className="page-hero">
        <PageContainer>
          <h1>Venue</h1>
          <p>Where to find each room and space on the day.</p>
        </PageContainer>
      </div>
      <div className="section">
        <PageContainer>
          <VenueGrid />
        </PageContainer>
      </div>
    </div>
  );
}
