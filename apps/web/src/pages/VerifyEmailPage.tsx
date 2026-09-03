import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '@scd/api-client';
import { apiClient } from '../lib/api.js';
import { useDocumentHead } from '../lib/seo.js';

type VerifyState = 'verifying' | 'success' | 'error';

export function VerifyEmailPage() {
  useDocumentHead({ title: 'Verify Email' });
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<VerifyState>('verifying');
  const [error, setError] = useState<string | null>(null);
  // Guards against React 18 StrictMode's double-invoked effect firing this
  // once-per-token request twice in development.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setState('error');
      setError('This link is missing its verification token.');
      return;
    }

    apiClient
      .post('/auth/verify-email', { token })
      .then(() => setState('success'))
      .catch((err: unknown) => {
        setState('error');
        setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
      });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Verify email</h1>

        {state === 'verifying' && <p className="auth-subtitle">Verifying your email…</p>}
        {state === 'success' && (
          <p className="form-success">Your email is verified. You can now log in.</p>
        )}
        {state === 'error' && <p className="form-error">{error}</p>}

        <p className="auth-switch">
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
