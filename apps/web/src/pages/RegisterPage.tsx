import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';
import { useDocumentHead } from '../lib/seo.js';

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  registrationType: 'STUDENT' | 'PROFESSIONAL' | '';
  dateOfBirth: string;
  university: string;
  department: string;
  branch: string;
  year: string;
  companyName: string;
  designation: string;
  linkedinUrl: string;
  consent: boolean;
}

const INITIAL_STATE: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  phone: '',
  registrationType: '',
  dateOfBirth: '',
  university: '',
  department: '',
  branch: '',
  year: '',
  companyName: '',
  designation: '',
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
      setError('Select whether you are a student or an employee.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
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
        phone: form.phone.trim(),
        registrationType: form.registrationType as 'STUDENT' | 'PROFESSIONAL',
        dateOfBirth: form.dateOfBirth,
        university: form.university.trim() || undefined,
        department: form.department.trim() || undefined,
        branch: form.branch.trim() || undefined,
        year: form.year.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        designation: form.designation.trim() || undefined,
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

  const isStudent = form.registrationType === 'STUDENT';
  const isEmployee = form.registrationType === 'PROFESSIONAL';
  const today = new Date().toISOString().slice(0, 10);

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
            <span>Confirm password *</span>
            <input
              type="password"
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="form-field">
            <span>Mobile number *</span>
            <input
              type="tel"
              required
              inputMode="tel"
              pattern="[0-9+ ]{7,20}"
              title="Digits only, optionally starting with +"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              autoComplete="tel"
            />
          </label>

          <fieldset className="form-field form-field-span" style={{ border: 'none', padding: 0, margin: 0 }}>
            <span>Profession *</span>
            <div className="dashboard-card-row">
              <label className="form-field-checkbox">
                <input
                  type="radio"
                  name="registrationType"
                  checked={isStudent}
                  onChange={() => setField('registrationType', 'STUDENT')}
                />
                <span>Student</span>
              </label>
              <label className="form-field-checkbox">
                <input
                  type="radio"
                  name="registrationType"
                  checked={isEmployee}
                  onChange={() => setField('registrationType', 'PROFESSIONAL')}
                />
                <span>Employee</span>
              </label>
            </div>
          </fieldset>

          {(isStudent || isEmployee) && (
            <>
              <p className="form-section-heading">{isStudent ? 'Student details' : 'Employment details'}</p>

              {isStudent && (
                <>
                  <label className="form-field">
                    <span>College/university name *</span>
                    <input
                      type="text"
                      required
                      value={form.university}
                      onChange={(e) => setField('university', e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>Department *</span>
                    <input
                      type="text"
                      required
                      value={form.department}
                      onChange={(e) => setField('department', e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>Branch *</span>
                    <input
                      type="text"
                      required
                      value={form.branch}
                      onChange={(e) => setField('branch', e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>Year of passout *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2027"
                      value={form.year}
                      onChange={(e) => setField('year', e.target.value)}
                    />
                  </label>
                </>
              )}

              {isEmployee && (
                <>
                  <label className="form-field">
                    <span>Company name *</span>
                    <input
                      type="text"
                      required
                      value={form.companyName}
                      onChange={(e) => setField('companyName', e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span>Designation *</span>
                    <input
                      type="text"
                      required
                      value={form.designation}
                      onChange={(e) => setField('designation', e.target.value)}
                    />
                  </label>
                </>
              )}

              <label className="form-field">
                <span>Date of birth *</span>
                <input
                  type="date"
                  required
                  max={today}
                  value={form.dateOfBirth}
                  onChange={(e) => setField('dateOfBirth', e.target.value)}
                  autoComplete="bday"
                />
              </label>
              <label className="form-field">
                <span>LinkedIn profile</span>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => setField('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                />
              </label>
            </>
          )}

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
