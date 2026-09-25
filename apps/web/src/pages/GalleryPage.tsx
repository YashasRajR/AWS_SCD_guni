import { GalleryGrid } from '../components/gallery/GalleryGrid.js';
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

      <GalleryMarqueeSection hideHeader={true} />

      <div className="section" style={{ padding: '48px 0 60px' }}>
        <PageContainer>
          <div style={{ marginBottom: '24px' }}>
            <h2 className="d2" style={{ fontSize: '24px', marginBottom: '6px' }}>Photo Archive</h2>
            <p className="tx" style={{ fontSize: '14px', color: 'var(--scd-muted)' }}>Browse and filter all moments across categories and event years.</p>
          </div>
          <GalleryGrid />
        </PageContainer>
      </div>
    </div>
  );
}
