import type { Certificate } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { formatDateTime, statusTone } from '../lib/format.js';
import { Badge } from '../components/ui/Badge.js';
import { useDocumentHead } from '../lib/seo.js';

export function MyCertificatePage() {
  useDocumentHead({ title: 'My Certificate' });
  const { items: certificates, loading, error } = useResource<Certificate>('/me/certificates');

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>My certificate</h1>
        <p className="page-section-lede">Your event participation certificate.</p>
      </header>

      {loading && <p className="status-line">Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && certificates.length === 0 && (
        <div className="empty-state">
          <p>No certificate yet.</p>
          <p className="status-line">
            Certificates are issued after the event based on your participation.
          </p>
        </div>
      )}

      {certificates.length > 0 && (
        <div className="dashboard-grid">
          {certificates.map((c) => (
            <section key={c.id} className="dashboard-card">
              <h2>{c.title}</h2>
              <p className="dashboard-card-row">
                <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                <span className="dashboard-card-meta">#{c.certificateNumber}</span>
              </p>
              <p className="status-line">Type: {c.certificateType}</p>
              <p className="status-line">Issued {formatDateTime(c.issuedAt)}</p>
              {c.fileUrl && (
                <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Download certificate
                </a>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
