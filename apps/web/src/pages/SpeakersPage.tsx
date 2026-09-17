import { SpeakerGrid } from '../components/speakers/SpeakerGrid.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

export function SpeakersPage() {
  useDocumentHead({
    title: 'Speakers',
    description: "Meet the people leading this year's talks and workshops at AWS Student Community Day 2026.",
  });

  return (
    <div>
      <div className="page-hero" style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--scd-border)' }}>
        <PageContainer>
          <p className="mo" style={{ color: 'var(--scd-muted)', marginBottom: '8px' }}>
            04 / Speakers
          </p>
          <h1 className="d1" style={{ fontSize: '36px', marginBottom: '8px' }}>
            See who&apos;s speaking
          </h1>
          <p className="tx" style={{ fontSize: '14px', maxWidth: '640px' }}>
            Line-up in progress. Placeholders stay until a speaker is confirmed. Real copy once confirmed — never invented.
          </p>
        </PageContainer>
      </div>
      <div className="section" style={{ padding: '32px 0 60px' }}>
        <PageContainer>
          <SpeakerGrid />
        </PageContainer>
      </div>
    </div>
  );
}
