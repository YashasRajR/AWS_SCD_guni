import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '@scd/api-client';
import { apiClient } from '../lib/api.js';
import { useDocumentHead } from '../lib/seo.js';

export function ResetPasswordPage() {
  useDocumentHead({ title: 'Reset Password' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('This reset link is missing its token. Request a new one.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset password</h1>

        {!token && (
          <p className="form-error">
            This link is missing its reset token. Request a new link from the{' '}
            <Link to="/forgot-password">forgot password</Link> page.
          </p>
        )}

        {done ? (
          <>
            <p className="form-success">Your password has been reset. You can now log in.</p>
            <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/login')}>
              Go to log in
            </button>
          </>
        ) : (
          <>
            <p className="auth-subtitle">Choose a new password for your account.</p>
            {error && <p className="form-error">{error}</p>}
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="form-field">
                <span>New password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <span className="form-help">At least 8 characters, with a letter and a number.</span>
              </label>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !token}>
                {submitting ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          </>
        )}

        <p className="auth-switch">
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
