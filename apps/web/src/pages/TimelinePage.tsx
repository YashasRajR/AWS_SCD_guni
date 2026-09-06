import { EventTimeline } from '../components/timeline/EventTimeline.js';
import { DownloadSchedulePdf } from '../components/event/DownloadSchedulePdf.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

export function TimelinePage() {
  useDocumentHead({
    title: 'Timeline',
    description: "A high-level look at how the day unfolds at AWS Student Community Day 2026.",
  });

  return (
    <div>
      <div className="page-hero">
        <PageContainer>
          <h1>Day flow</h1>
          <p>A quick, high-level look at how the day unfolds.</p>
        </PageContainer>
      </div>
      <div className="section">
        <PageContainer>
          <DownloadSchedulePdf />
          <EventTimeline />
        </PageContainer>
      </div>
    </div>
  );
}
