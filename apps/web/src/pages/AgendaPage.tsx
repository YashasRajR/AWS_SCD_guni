import { AgendaList } from '../components/agenda/AgendaList.js';
import { DownloadSchedulePdf } from '../components/event/DownloadSchedulePdf.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

export function AgendaPage() {
  useDocumentHead({
    title: 'Agenda',
    description: 'The detailed, time-by-time run of AWS Student Community Day 2026.',
  });

  return (
    <div>
      <div className="page-hero" style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--scd-border)' }}>
        <PageContainer>
          <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div className="c" style={{ gap: '4px' }}>
              <h1 className="d1" style={{ fontSize: '36px', margin: 0 }}>
                How the day runs
              </h1>
              <p className="tx" style={{ fontSize: '14px', maxWidth: '640px' }}>
                The detailed, time-by-time run of the day. Breaks and lunch are marked with orange rules.
              </p>
            </div>
            <DownloadSchedulePdf />
          </div>
        </PageContainer>
      </div>
      <div className="section" style={{ padding: '32px 0 60px' }}>
        <PageContainer>
          <AgendaList />
        </PageContainer>
      </div>
    </div>
  );
}
