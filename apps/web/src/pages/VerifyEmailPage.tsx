import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '@scd/api-client';
import { apiClient } from '../lib/api.js';
import { useDocumentHead } from '../lib/seo.js';
import { Mascot } from '../components/ui/Mascot.js';

type VerifyState = 'verifying' | 'success' | 'error';

export function VerifyEmailPage() {
  useDocumentHead({ title: 'Verify Email · AWS SCD 2026' });
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<VerifyState>('verifying');
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setState('error');
      setError('This verification link is missing its token.');
      return;
    }

    apiClient
      .post('/auth/verify-email', { token })
      .then(() => setState('success'))
      .catch((err: unknown) => {
        setState('error');
        setError(err instanceof ApiClientError ? err.message : 'Invalid or expired verification link.');
      });
  }, [token]);

  return (
    <div className="section" style={{ padding: '48px 0 80px', minHeight: 'calc(100vh - 280px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '420px', width: '100%', padding: '0 16px' }}>
        <div className="k" style={{ padding: '24px', gap: '16px', background: 'var(--scd-surface)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Mascot variant={state === 'error' ? 'sad' : 'default'} size={56} />
          </div>

          <h1 className="d3" style={{ margin: 0, fontSize: '20px' }}>
            {state === 'verifying' && 'Verifying your email…'}
            {state === 'success' && 'Email verified!'}
            {state === 'error' && 'Verification failed'}
          </h1>

          {state === 'verifying' && (
            <p className="tx" style={{ color: 'var(--scd-muted)' }}>
              Checking your confirmation link with the server…
            </p>
          )}

          {state === 'success' && (
            <div className="c" style={{ gap: '12px' }}>
              <p className="tx">
                Your email address has been verified. You can now sign in to your dashboard.
              </p>
              <Link to="/login" className="btn o" style={{ textDecoration: 'none', justifyContent: 'center', minHeight: '44px' }}>
                Go to log in →
              </Link>
            </div>
          )}

          {state === 'error' && (
            <div className="c" style={{ gap: '12px' }}>
              <div className="k mut" style={{ padding: '12px' }}>
                <p className="tx" style={{ color: '#b3261e', fontSize: '13px' }}>{error}</p>
              </div>
              <Link to="/login" className="btn g" style={{ textDecoration: 'none', justifyContent: 'center', minHeight: '44px' }}>
                Back to log in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
