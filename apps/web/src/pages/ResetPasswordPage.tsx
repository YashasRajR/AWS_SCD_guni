import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '@scd/api-client';
import { apiClient } from '../lib/api.js';
import { useDocumentHead } from '../lib/seo.js';
import { PasswordInput } from '../components/ui/PasswordInput.js';
import { Mascot } from '../components/ui/Mascot.js';

export function ResetPasswordPage() {
  useDocumentHead({ title: 'Reset Password · AWS SCD 2026' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
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
    if (password !== repeatPassword) {
      setError('Passwords do not match.');
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
    <div className="section" style={{ padding: '48px 0 80px', minHeight: 'calc(100vh - 280px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '420px', width: '100%', padding: '0 16px' }}>
        <div className="k" style={{ padding: '24px', gap: '16px', background: 'var(--scd-surface)' }}>
          <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>Account security</p>
              <h1 className="d3" style={{ margin: '2px 0 0', fontSize: '20px' }}>Reset password</h1>
            </div>
            <Mascot variant="default" size={44} />
          </div>

          {!token && (
            <div className="k mut" style={{ padding: '12px', gap: '8px' }}>
              <p className="mo" style={{ color: '#b3261e' }}>Expired / Missing token</p>
              <p className="tx" style={{ fontSize: '12px' }}>
                This reset link is invalid or expired. Please request a fresh one.
              </p>
              <Link to="/forgot-password" className="btn o" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                Send new link
              </Link>
            </div>
          )}

          {done ? (
            <div className="k mut" style={{ padding: '16px', gap: '8px', textAlign: 'center' }}>
              <p className="lbl" style={{ color: 'var(--scd-primary)' }}>Password updated!</p>
              <p className="tx" style={{ fontSize: '13px' }}>Your new password has been saved. You can now log in.</p>
              <button
                type="button"
                className="btn o"
                onClick={() => navigate('/login')}
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px', cursor: 'pointer' }}
              >
                Go to log in →
              </button>
            </div>
          ) : token ? (
            <>
              {error && (
                <div className="k" style={{ borderColor: '#b3261e', background: '#fdf2f2', padding: '10px 12px' }}>
                  <p className="tx" style={{ color: '#b3261e', fontSize: '12px' }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="c" style={{ gap: '12px' }}>
                <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                  <label className="mo" style={{ fontSize: '11px' }}>New password</label>
                  <PasswordInput
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                  <label className="mo" style={{ fontSize: '11px' }}>Repeat password</label>
                  <PasswordInput
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>

                <button
                  type="submit"
                  className="btn o"
                  disabled={submitting}
                  style={{ minHeight: '44px', width: '100%', justifyContent: 'center', cursor: submitting ? 'wait' : 'pointer' }}
                >
                  {submitting ? 'Saving password…' : 'Save password'}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
