import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Certificate } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { useDocumentHead } from '../lib/seo.js';
import { Mascot } from '../components/ui/Mascot.js';
import { useAuth } from '../lib/auth.js';
import { useToast } from '../lib/toast.js';

export function MyCertificatePage() {
  useDocumentHead({ title: 'Certificate · AWS SCD 2026' });
  const { user } = useAuth();
  const { data: me } = useResource<{ attendee?: { fullName: string; university?: string } }>('/me');
  const { items: certificates, loading } = useResource<Certificate>('/me/certificates');
  const { addToast } = useToast();

  const [previewReady, setPreviewReady] = useState(false);

  const hasRealCertificate = certificates.length > 0;
  const isReady = hasRealCertificate || previewReady;

  const attendeeName = me?.attendee?.fullName || user?.email?.split('@')[0] || 'Riya Patel';
  const certNumber = hasRealCertificate ? certificates[0]?.certificateNumber : 'SCD26-CERT-0417';

  const downloadPdf = () => {
    if (hasRealCertificate && certificates[0]?.fileUrl) {
      window.open(certificates[0].fileUrl, '_blank');
    } else {
      // Simulate print / PDF generation
      window.print();
      addToast('Print / Save as PDF dialog opened', 'info');
    }
  };

  const shareToLinkedIn = () => {
    const title = encodeURIComponent('AWS Student Community Day 2026 Certificate');
    const summary = encodeURIComponent(
      `Proud to receive my certificate of participation for AWS Students Community Day 2026 at Ganpat University! @aws.sbg_guni #AWSSCD2026`,
    );
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="section" style={{ padding: '32px 0 60px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px' }}>
        <p className="mo" style={{ color: 'var(--scd-muted)', marginBottom: '16px' }}>
          <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</Link> / Certificate
        </p>

        <div className="c" style={{ gap: '20px' }}>
          <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="d2" style={{ margin: 0, fontSize: '26px' }}>Certificate of Participation</h1>
            <button
              type="button"
              onClick={() => setPreviewReady(!previewReady)}
              className="chip"
              style={{ fontSize: '10px', padding: '4px 10px', cursor: 'pointer' }}
            >
              Toggle {isReady ? 'Gated state' : 'Ready state'}
            </button>
          </div>

          {/* GATED STATE (Wireframe 1j) */}
          {!isReady && !loading && (
            <div
              className="k mut"
              style={{
                alignItems: 'center',
                textAlign: 'center',
                padding: '36px 20px',
                gap: '12px',
                background: 'var(--scd-surface-muted)',
              }}
            >
              <Mascot variant="default" size={68} />
              <h2 className="d3" style={{ margin: 0, fontSize: '18px' }}>Not available yet</h2>
              <p className="tx" style={{ color: 'var(--scd-muted)', maxWidth: '360px', fontSize: '13px' }}>
                Your certificate unlocks once attendance is verified on 8 October 2026. Complete the check-in station to unlock your verified credential.
              </p>
              <span className="mo" style={{ color: 'var(--scd-muted)', fontSize: '10px', marginTop: '6px' }}>
                Gated state · Wireframe 1j
              </span>
            </div>
          )}

          {/* READY STATE: A4 Certificate Preview (Wireframe 1j) */}
          {isReady && (
            <div className="c" style={{ gap: '16px' }}>
              <div
                className="certificate-preview-sheet"
                style={{
                  background: '#fff',
                  border: '2px solid var(--scd-primary)',
                  borderRadius: '4px',
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: 'var(--scd-shadow-sm)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '8px',
                    border: '1.5px dashed var(--scd-accent)',
                    borderRadius: '2px',
                    pointerEvents: 'none',
                  }}
                />

                <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="r" style={{ alignItems: 'center', gap: '8px' }}>
                    <Mascot variant="sm" size={32} />
                    <span className="mo" style={{ fontSize: '11px', fontWeight: 700 }}>AWS SCD 2026</span>
                  </div>
                  <span className="mo" style={{ fontSize: '10px', color: 'var(--scd-muted)' }}>
                    {certNumber}
                  </span>
                </div>

                <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p className="mo" style={{ color: 'var(--scd-accent)', letterSpacing: '0.12em', fontSize: '11px' }}>
                    CERTIFICATE OF PARTICIPATION
                  </p>
                  <p className="tx" style={{ fontSize: '12px', color: 'var(--scd-muted)' }}>
                    This is proudly presented to
                  </p>
                  <h2 className="d1" style={{ fontSize: '28px', margin: 0, color: 'var(--scd-primary)' }}>
                    {attendeeName}
                  </h2>
                  <p className="tx" style={{ fontSize: '13px', color: 'var(--scd-fg)' }}>
                    for active participation in AWS Students Community Day 2026, held at the Centre of Excellence, Ganpat University, Gujarat on 8 October 2026.
                  </p>
                </div>

                <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--scd-border)', paddingTop: '14px' }}>
                  <div className="c" style={{ gap: '2px' }}>
                    <p className="mo" style={{ fontSize: '9px', color: 'var(--scd-muted)' }}>DATE</p>
                    <p className="lbl" style={{ fontSize: '11px' }}>8 October 2026</p>
                  </div>
                  <div className="c" style={{ gap: '2px', textAlign: 'center' }}>
                    <p className="mo" style={{ fontSize: '9px', color: 'var(--scd-muted)' }}>VENUE</p>
                    <p className="lbl" style={{ fontSize: '11px' }}>GUNI Mehsana</p>
                  </div>
                  <div className="c" style={{ gap: '2px', textAlign: 'right' }}>
                    <p className="mo" style={{ fontSize: '9px', color: 'var(--scd-muted)' }}>ORGANIZATION</p>
                    <p className="lbl" style={{ fontSize: '11px' }}>AWS Student Community Club</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="r" style={{ gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={downloadPdf}
                  className="btn o"
                  style={{ minHeight: '44px', padding: '0 20px', cursor: 'pointer' }}
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={shareToLinkedIn}
                  className="btn g"
                  style={{ minHeight: '44px', padding: '0 20px', cursor: 'pointer' }}
                >
                  Share to LinkedIn
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
