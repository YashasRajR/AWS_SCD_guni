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
      <div className="page-hero">
        <PageContainer>
          <h1>Agenda</h1>
          <p>The detailed, time-by-time run of the day.</p>
        </PageContainer>
      </div>
      <div className="section">
        <PageContainer>
          <DownloadSchedulePdf />
          <AgendaList />
        </PageContainer>
      </div>
    </div>
  );
}
