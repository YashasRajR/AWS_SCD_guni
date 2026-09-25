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
      <div className="page-hero" style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--scd-border)' }}>
        <PageContainer>
          <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div className="c" style={{ gap: '4px' }}>
              <h1 className="d1" style={{ fontSize: '36px', margin: 0 }}>
                08 October 2026
              </h1>
              <p className="tx" style={{ fontSize: '14px', maxWidth: '640px' }}>
                The whole day, station by station. Times are provisional until programming lands. Tap any station to view its room and details.
              </p>
            </div>
            <DownloadSchedulePdf />
          </div>
        </PageContainer>
      </div>
      <div className="section" style={{ padding: '32px 0 60px' }}>
        <PageContainer>
          <EventTimeline />
        </PageContainer>
      </div>
    </div>
  );
}
