import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError } from '@scd/api-client';
import { apiClient } from '../lib/api.js';
import { useDocumentHead } from '../lib/seo.js';

export function ForgotPasswordPage() {
  useDocumentHead({ title: 'Forgot Password' });
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      // The backend never reveals whether the email exists, so the UI
      // always shows the same "check your inbox" message either way.
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot password</h1>
        <p className="auth-subtitle">
          Enter the email you registered with and we&apos;ll send you a link to reset your password.
        </p>

        {submitted ? (
          <p className="form-success">
            If an account exists for that email, a password reset link is on its way. Check your inbox.
          </p>
        ) : (
          <>
            {error && <p className="form-error">{error}</p>}
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
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
