import { Link } from 'react-router-dom';
import { useEvent } from '../lib/queries.js';
import { PageContainer } from '../components/layout/PageContainer.js';
import { useDocumentHead } from '../lib/seo.js';

/** Wireframe 1l "404": "This page took a wrong turn." + Back home + (if we
 * have a real contact address) Report it. No mascot artwork exists in this
 * codebase, so this stays text + actions rather than inventing one. */
export function NotFoundPage() {
  useDocumentHead({ title: 'Page not found' });
  const { data: event } = useEvent();

  return (
    <div className="section">
      <PageContainer>
        <div className="state-panel">
          <h1>This page took a wrong turn</h1>
          <p>The link may be old or mistyped.</p>
          <div className="dashboard-card-row">
            <Link to="/" className="btn btn-primary">
              Back home
            </Link>
            {event?.contactEmail && (
              <a href={`mailto:${event.contactEmail}`} className="btn btn-secondary">
                Report it
              </a>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
