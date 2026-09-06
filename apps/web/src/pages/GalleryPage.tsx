import { GalleryGrid } from '../components/gallery/GalleryGrid.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

export function GalleryPage() {
  useDocumentHead({
    title: 'Gallery',
    description: 'Photos from AWS Student Community Day 2026 — talks, workshops, and the community behind them.',
  });

  return (
    <div>
      <div className="page-hero">
        <PageContainer>
          <h1>Gallery</h1>
          <p>Moments from the event, in pictures.</p>
        </PageContainer>
      </div>
      <div className="section">
        <PageContainer>
          <GalleryGrid />
        </PageContainer>
      </div>
    </div>
  );
}
