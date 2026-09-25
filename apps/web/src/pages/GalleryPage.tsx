import { GalleryMarqueeSection } from '../components/gallery/GalleryMarqueeSection.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

export function GalleryPage() {
  useDocumentHead({
    title: 'Gallery',
    description: 'Photos from AWS Student Community Day 2026 — talks, workshops, and the community behind them.',
  });

  return (
    <div>
      <div className="page-hero" style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--scd-border)' }}>
        <PageContainer>
          <h1 className="d1" style={{ fontSize: '36px', marginBottom: '8px' }}>
            Gallery
          </h1>
          <p className="tx" style={{ fontSize: '14px', maxWidth: '640px' }}>
            Photos from AWS Student Community Day — talks, workshops, hackathons, and the students behind them.
          </p>
        </PageContainer>
      </div>

      <div style={{ padding: '30px 0 60px' }}>
        <GalleryMarqueeSection hideHeader={true} />
      </div>
    </div>
  );
}
