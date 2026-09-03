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
      <div className="page-hero">
        <PageContainer>
          <h1>Speakers</h1>
          <p>Meet the people leading this year&apos;s talks and workshops.</p>
        </PageContainer>
      </div>
      <div className="section">
        <PageContainer>
          <SpeakerGrid />
        </PageContainer>
      </div>
    </div>
  );
}
