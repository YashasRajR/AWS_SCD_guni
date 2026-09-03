import { FAQAccordion } from '../components/faq/FAQAccordion.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

export function FaqPage() {
  useDocumentHead({
    title: 'FAQ',
    description: 'Frequently asked questions about AWS Student Community Day 2026.',
  });

  return (
    <div>
      <div className="page-hero">
        <PageContainer>
          <h1>Frequently asked questions</h1>
          <p>Can&apos;t find your answer here? Reach out to the organizing team.</p>
        </PageContainer>
      </div>
      <div className="section">
        <PageContainer>
          <FAQAccordion />
        </PageContainer>
      </div>
    </div>
  );
}
