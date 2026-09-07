import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { useDocumentHead } from '../lib/seo.js';

interface FormState {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  university: string;
  department: string;
  year: string;
  registrationType: 'STUDENT' | 'PROFESSIONAL' | '';
  linkedinUrl: string;
  consent: boolean;
}

const INITIAL_STATE: FormState = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  university: '',
  department: '',
  year: '',
  registrationType: '',
  linkedinUrl: '',
  consent: false,
};

export function RegisterPage() {
  useDocumentHead({ title: 'Register' });
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.registrationType) {
      setError('Select whether you are a student or a professional.');
      return;
    }
    if (!form.consent) {
      setError('You must accept the terms to register.');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone.trim() || undefined,
        university: form.university.trim() || undefined,
        department: form.department.trim() || undefined,
        year: form.year.trim() || undefined,
        registrationType: form.registrationType as 'STUDENT' | 'PROFESSIONAL',
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        consent: true,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>Create your account</h1>
        <p className="auth-subtitle">
          This creates your attendee profile. You&apos;ll register for the event itself from your dashboard.
        </p>

        {error && <p className="form-error">{error}</p>}

        <form className="auth-form auth-form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Full name *</span>
            <input
              type="text"
              required
              minLength={2}
              value={form.fullName}
              onChange={(e) => setField('fullName', e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="form-field">
            <span>Email *</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="form-field">
            <span>Password *</span>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              autoComplete="new-password"
            />
            <span className="form-help">At least 8 characters, with a letter and a number.</span>
          </label>
          <label className="form-field">
            <span>Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              autoComplete="tel"
            />
          </label>
          <label className="form-field">
            <span>University</span>
            <input
              type="text"
              value={form.university}
              onChange={(e) => setField('university', e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Department</span>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setField('department', e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Year</span>
            <input type="text" value={form.year} onChange={(e) => setField('year', e.target.value)} />
          </label>

          <fieldset className="form-field form-field-span" style={{ border: 'none', padding: 0, margin: 0 }}>
            <span>I am registering as *</span>
            <div className="dashboard-card-row">
              <label className="form-field-checkbox">
                <input
                  type="radio"
                  name="registrationType"
                  checked={form.registrationType === 'STUDENT'}
                  onChange={() => setField('registrationType', 'STUDENT')}
                />
                <span>Student</span>
              </label>
              <label className="form-field-checkbox">
                <input
                  type="radio"
                  name="registrationType"
                  checked={form.registrationType === 'PROFESSIONAL'}
                  onChange={() => setField('registrationType', 'PROFESSIONAL')}
                />
                <span>Professional</span>
              </label>
            </div>
          </fieldset>

          <label className="form-field form-field-span">
            <span>LinkedIn profile</span>
            <input
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => setField('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
            />
          </label>

          <label className="form-field form-field-checkbox form-field-span">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setField('consent', e.target.checked)}
            />
            <span>I agree to the event terms and to being contacted about this event.</span>
          </label>

          <button type="submit" className="btn btn-primary btn-block form-field-span" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
