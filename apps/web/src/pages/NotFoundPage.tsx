import { Link } from 'react-router-dom';
import { useEvent } from '../lib/queries.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';
import { Mascot } from '../components/ui/Mascot.js';

export function NotFoundPage() {
  useDocumentHead({ title: 'Page not found — 404' });
  const { data: event } = useEvent();

  return (
    <div className="section">
      <PageContainer>
        <div style={{ maxWidth: '460px', margin: '40px auto' }}>
          <div className="k" style={{ alignItems: 'center', textAlign: 'center', padding: '32px 20px', gap: '16px' }}>
            <Mascot variant="sad" size={72} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p className="d2">This page took a wrong turn</p>
              <p className="tx" style={{ color: 'var(--muted)' }}>
                The link may be old, mistyped, or the page was moved.
              </p>
            </div>
            <div className="r" style={{ gap: '10px', marginTop: '8px' }}>
              <Link to="/" className="btn o">
                Back home
              </Link>
              <a href={`mailto:${event?.contactEmail || 'awscloudclub@ganpatuniversity.ac.in'}`} className="btn g">
                Report it
              </a>
            </div>
            <p className="mo" style={{ marginTop: '8px', color: 'var(--border-dashed)' }}>404 · AWS SCD 2026</p>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
