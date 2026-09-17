import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { PasswordInput } from '../components/ui/PasswordInput.js';
import { useDocumentHead } from '../lib/seo.js';
import { Mascot } from '../components/ui/Mascot.js';

export function LoginPage() {
  useDocumentHead({ title: 'Log In · AWS SCD 2026' });
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "That email and password don't match. Try again or reset it.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section" style={{ padding: '48px 0 80px', minHeight: 'calc(100vh - 280px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '420px', width: '100%', padding: '0 16px' }}>
        <div className="c" style={{ gap: '20px' }}>
          {/* Main login card matching wireframe 1g */}
          <div className="k" style={{ padding: '24px', gap: '16px', background: 'var(--scd-surface)' }}>
            <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>Welcome back</p>
                <h1 className="d3" style={{ margin: '2px 0 0', fontSize: '20px' }}>Log in</h1>
              </div>
              <Mascot variant="wave" size={44} />
            </div>

            {error && (
              <div className="k" style={{ borderColor: '#b3261e', background: '#fdf2f2', padding: '10px 12px', gap: '4px' }}>
                <p className="mo" style={{ color: '#b3261e', fontSize: '11px' }}>Error summary</p>
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

              <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                <label className="mo" style={{ fontSize: '11px' }}>Password</label>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Your password"
                />
              </div>

              <button
                type="submit"
                className="btn o"
                disabled={submitting}
                style={{
                  minHeight: '44px',
                  width: '100%',
                  justifyContent: 'center',
                  fontSize: '13px',
                  cursor: submitting ? 'wait' : 'pointer',
                }}
              >
                {submitting ? 'Logging in…' : 'Log in'}
              </button>

              <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <Link to="/forgot-password" className="btn g" style={{ fontSize: '11px', textDecoration: 'none', padding: '4px 8px' }}>
                  Forgot password?
                </Link>
                <Link to="/register" className="mo" style={{ fontSize: '11px', color: 'var(--scd-accent)', textDecoration: 'none' }}>
                  Register free →
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
