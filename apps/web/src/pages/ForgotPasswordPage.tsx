import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError } from '@scd/api-client';
import { apiClient } from '../lib/api.js';
import { useDocumentHead } from '../lib/seo.js';
import { Mascot } from '../components/ui/Mascot.js';

export function ForgotPasswordPage() {
  useDocumentHead({ title: 'Forgot Password · AWS SCD 2026' });
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
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section" style={{ padding: '48px 0 80px', minHeight: 'calc(100vh - 280px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '420px', width: '100%', padding: '0 16px' }}>
        <div className="k" style={{ padding: '24px', gap: '16px', background: 'var(--scd-surface)' }}>
          <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>Account recovery</p>
              <h1 className="d3" style={{ margin: '2px 0 0', fontSize: '20px' }}>Forgot password</h1>
            </div>
            <Mascot variant="default" size={44} />
          </div>

          {submitted ? (
            <div className="k mut" style={{ padding: '16px', gap: '8px', textAlign: 'center' }}>
              <p className="lbl" style={{ color: 'var(--scd-primary)' }}>Check your inbox</p>
              <p className="tx" style={{ fontSize: '13px' }}>
                If an account exists for that email, a password reset link is on its way. Follow the link inside to set a new password.
              </p>
              <Link to="/login" className="btn o" style={{ textDecoration: 'none', justifyContent: 'center', marginTop: '8px' }}>
                Back to log in
              </Link>
            </div>
          ) : (
            <>
              <p className="tx" style={{ color: 'var(--scd-muted)', fontSize: '13px' }}>
                Enter the email you registered with and we&apos;ll send you a password reset link.
              </p>

              {error && (
                <div className="k" style={{ borderColor: '#b3261e', background: '#fdf2f2', padding: '10px 12px' }}>
                  <p className="tx" style={{ color: '#b3261e', fontSize: '12px' }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="c" style={{ gap: '12px' }}>
                <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                  <label className="mo" style={{ fontSize: '11px' }}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@college.edu"
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn o"
                  disabled={submitting}
                  style={{ minHeight: '44px', width: '100%', justifyContent: 'center', cursor: submitting ? 'wait' : 'pointer' }}
                >
                  {submitting ? 'Sending link…' : 'Send reset link'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <Link to="/login" className="mo" style={{ fontSize: '11px', color: 'var(--scd-accent)', textDecoration: 'none' }}>
                    ← Back to log in
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
