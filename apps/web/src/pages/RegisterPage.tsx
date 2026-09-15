import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { emailSchema, passwordSchema, phoneSchema } from '@scd/validation';
import type { TicketPlan } from '@scd/types';
import { useAuth } from '../lib/auth.js';
import { useResource } from '../lib/hooks.js';
import { useDocumentHead } from '../lib/seo.js';
import { PasswordInput } from '../components/ui/PasswordInput.js';
import { PlanCard } from '../components/PlanCard.js';

// A student registering could be starting out or already graduated but
// still finishing up -- a few years back and several ahead covers the
// realistic range without letting someone type garbage into a free-text
// field.
const CURRENT_YEAR = new Date().getFullYear();
const PASSOUT_YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => String(CURRENT_YEAR - 1 + i));

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
  collegeId: string;
  groupName: string;
  yearsOfExperience: string;
  howHeard: string;
  tshirtSize: '' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  dietaryPreference: string;
  emergencyContact: string;
  consent: boolean;
}

const INITIAL_STATE: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  phone: '+91',
  registrationType: '',
  dateOfBirth: '',
  university: '',
  department: '',
  branch: '',
  year: '',
  companyName: '',
  designation: '',
  linkedinUrl: '',
  collegeId: '',
  groupName: '',
  yearsOfExperience: '',
  howHeard: '',
  tshirtSize: '',
  dietaryPreference: '',
  emergencyContact: '',
  consent: false,
};

type Phase = 'plan' | 'form' | 'summary';
type FieldKey = keyof FormState;

const today = new Date().toISOString().slice(0, 10);

// Every validator returns null when the value is fine, or the exact
// message to show — same rules as the backend's registerSchema (@scd/validation),
// so a value that passes here never gets rejected by the API afterwards.
function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Enter your email address.';
  return emailSchema.safeParse(v).success ? null : 'Enter a valid email address, e.g. name@example.com.';
}
function validatePassword(v: string): string | null {
  if (!v) return 'Enter a password.';
  const result = passwordSchema.safeParse(v);
  return result.success ? null : (result.error.issues[0]?.message ?? 'Enter a valid password.');
}
function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Re-enter your password.';
  return password === confirm ? null : 'Passwords do not match.';
}
function validatePhone(v: string): string | null {
  if (!v.trim() || v.trim() === '+91') return 'Enter your mobile number.';
  return phoneSchema.safeParse(v.trim()).success
    ? null
    : 'Enter a valid Indian mobile number, e.g. +919876543210.';
}
function validateFullName(v: string): string | null {
  return v.trim().length >= 2 ? null : 'Enter your full name.';
}
function validateDob(v: string): string | null {
  if (!v) return 'Enter your date of birth.';
  return v <= today ? null : 'Date of birth cannot be in the future.';
}
function validateRequiredText(v: string, label: string): string | null {
  return v.trim() ? null : `Enter your ${label}.`;
}
function validateLinkedin(v: string): string | null {
  if (!v.trim()) return null; // optional
  return /^https?:\/\/.+/i.test(v.trim()) ? null : 'Enter a valid URL, starting with https://.';
}
function validateEmergencyContact(v: string): string | null {
  if (!v.trim() || v.trim() === '+91') return null; // optional
  return phoneSchema.safeParse(v.trim()).success
    ? null
    : 'Enter a valid Indian mobile number, e.g. +919876543210.';
}

export function RegisterPage() {
  useDocumentHead({ title: 'Register' });
  const { register } = useAuth();
  const navigate = useNavigate();
  const { items: ticketPlans, loading: plansLoading, error: plansError } = useResource<TicketPlan>('/ticket-plans');

  const [phase, setPhase] = useState<Phase>('plan');
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends FieldKey>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const markTouched = (key: FieldKey) => setTouched((prev) => ({ ...prev, [key]: true }));

  const isStudent = form.registrationType === 'STUDENT';
  const isEmployee = form.registrationType === 'PROFESSIONAL';

  const selectedPlan = ticketPlans.find((p) => p.code === form.registrationType);

  // Every field's current error, computed fresh from form state -- also
  // doubles as the "is this section complete" check (no key -> no errors).
  const fieldErrors: Partial<Record<FieldKey, string>> = {};
  const setIfError = (key: FieldKey, message: string | null) => {
    if (message) fieldErrors[key] = message;
  };
  setIfError('fullName', validateFullName(form.fullName));
  setIfError('email', validateEmail(form.email));
  setIfError('password', validatePassword(form.password));
  setIfError('confirmPassword', validateConfirmPassword(form.password, form.confirmPassword));
  setIfError('phone', validatePhone(form.phone));
  setIfError('dateOfBirth', validateDob(form.dateOfBirth));
  setIfError('linkedinUrl', validateLinkedin(form.linkedinUrl));
  setIfError('emergencyContact', validateEmergencyContact(form.emergencyContact));
  if (isStudent) {
    setIfError('university', validateRequiredText(form.university, 'college/university name'));
    setIfError('department', validateRequiredText(form.department, 'department'));
    setIfError('branch', validateRequiredText(form.branch, 'branch'));
    setIfError('year', validateRequiredText(form.year, 'year of passout'));
  }
  if (isEmployee) {
    setIfError('companyName', validateRequiredText(form.companyName, 'company name'));
    setIfError('designation', validateRequiredText(form.designation, 'designation'));
  }

  const formIsValid = Object.keys(fieldErrors).length === 0;

  const showError = (key: FieldKey) => (touched[key] ? fieldErrors[key] : undefined);

  const touchAllFormFields = () => {
    setTouched((prev) => ({
      ...prev,
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true,
      dateOfBirth: true,
      linkedinUrl: true,
      university: true,
      department: true,
      branch: true,
      year: true,
      companyName: true,
      designation: true,
      emergencyContact: true,
    }));
  };

  const choosePlan = (type: 'STUDENT' | 'PROFESSIONAL') => {
    setField('registrationType', type);
    setPhase('form');
  };

  const continueToSummary = () => {
    if (!formIsValid) {
      touchAllFormFields();
      return;
    }
    setPhase('summary');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.consent) {
      setError('You must accept the terms to continue.');
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
        collegeId: form.collegeId.trim() || undefined,
        groupName: form.groupName.trim() || undefined,
        yearsOfExperience: form.yearsOfExperience.trim() || undefined,
        howHeard: form.howHeard.trim() || undefined,
        tshirtSize: form.tshirtSize || undefined,
        dietaryPreference: form.dietaryPreference.trim() || undefined,
        emergencyContact:
          form.emergencyContact.trim() && form.emergencyContact.trim() !== '+91'
            ? form.emergencyContact.trim()
            : undefined,
        consent: true,
      });
      // Account created — but no dashboard access yet. /complete-registration
      // creates the actual event registration for this plan (confirmed
      // immediately -- see App.tsx's RequireConfirmedRegistration).
      navigate('/complete-registration', {
        replace: true,
        state: { ticketPlanCode: form.registrationType },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>Register for AWS Student Community Day 2026</h1>
        <p className="auth-subtitle">
          {phase === 'plan'
            ? 'First, tell us which ticket applies to you — the form after this only asks what that ticket needs.'
            : phase === 'form'
              ? 'Fill in your details below. You can review everything before it’s submitted.'
              : 'Check everything below, then continue to payment.'}
        </p>

        {phase === 'plan' && (
          <div className="register-plan-step">
            {plansError && <p className="form-error">{plansError}</p>}
            {plansLoading ? (
              <p className="status-line">Loading ticket types…</p>
            ) : (
              <div className="plan-card-grid">
                {ticketPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onClick={() => choosePlan(plan.code as 'STUDENT' | 'PROFESSIONAL')}
                    cta={<span className="btn-link">Choose {plan.name} →</span>}
                  />
                ))}
              </div>
            )}
            <p className="auth-switch">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        )}

        {phase === 'form' && (
          <form
            className="auth-form auth-form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              continueToSummary();
            }}
          >
            <fieldset className="form-field-span register-section">
              <legend>Account details</legend>
              <div className="auth-form-grid">
                <label className="form-field">
                  <span>Full name *</span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setField('fullName', e.target.value)}
                    onBlur={() => markTouched('fullName')}
                    autoComplete="name"
                    aria-invalid={Boolean(showError('fullName'))}
                  />
                  {showError('fullName') && <span className="form-error">{showError('fullName')}</span>}
                </label>
                <label className="form-field">
                  <span>Email *</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    onBlur={() => markTouched('email')}
                    autoComplete="email"
                    aria-invalid={Boolean(showError('email'))}
                  />
                  {showError('email') && <span className="form-error">{showError('email')}</span>}
                </label>
                <label className="form-field">
                  <span>Password *</span>
                  <PasswordInput
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    onBlur={() => markTouched('password')}
                    autoComplete="new-password"
                    aria-invalid={Boolean(showError('password'))}
                  />
                  {showError('password') ? (
                    <span className="form-error">{showError('password')}</span>
                  ) : (
                    <span className="form-help">At least 8 characters, with a letter and a number.</span>
                  )}
                </label>
                <label className="form-field">
                  <span>Confirm password *</span>
                  <PasswordInput
                    value={form.confirmPassword}
                    onChange={(e) => setField('confirmPassword', e.target.value)}
                    onBlur={() => markTouched('confirmPassword')}
                    autoComplete="new-password"
                    aria-invalid={Boolean(showError('confirmPassword'))}
                  />
                  {showError('confirmPassword') && (
                    <span className="form-error">{showError('confirmPassword')}</span>
                  )}
                </label>
                <label className="form-field">
                  <span>Mobile number *</span>
                  <div className="phone-input-group">
                    <span className="phone-prefix" aria-hidden="true">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={form.phone.replace(/^\+91/, '')}
                      onChange={(e) =>
                        setField('phone', `+91${e.target.value.replace(/\D/g, '').slice(0, 10)}`)
                      }
                      onBlur={() => markTouched('phone')}
                      autoComplete="tel-national"
                      placeholder="9876543210"
                      maxLength={10}
                      aria-invalid={Boolean(showError('phone'))}
                    />
                  </div>
                  {showError('phone') ? (
                    <span className="form-error">{showError('phone')}</span>
                  ) : (
                    <span className="form-help">10-digit mobile number, e.g. 9876543210.</span>
                  )}
                </label>
              </div>
            </fieldset>

            <fieldset className="form-field-span register-section">
              <legend>{isStudent ? 'Student details' : 'Employee details'}</legend>
              <div className="auth-form-grid">
                {isStudent && (
                  <>
                    <label className="form-field">
                      <span>College/university name *</span>
                      <input
                        type="text"
                        value={form.university}
                        onChange={(e) => setField('university', e.target.value)}
                        onBlur={() => markTouched('university')}
                        aria-invalid={Boolean(showError('university'))}
                      />
                      {showError('university') && <span className="form-error">{showError('university')}</span>}
                    </label>
                    <label className="form-field">
                      <span>Department *</span>
                      <input
                        type="text"
                        value={form.department}
                        onChange={(e) => setField('department', e.target.value)}
                        onBlur={() => markTouched('department')}
                        aria-invalid={Boolean(showError('department'))}
                      />
                      {showError('department') && <span className="form-error">{showError('department')}</span>}
                    </label>
                    <label className="form-field">
                      <span>Branch *</span>
                      <input
                        type="text"
                        value={form.branch}
                        onChange={(e) => setField('branch', e.target.value)}
                        onBlur={() => markTouched('branch')}
                        aria-invalid={Boolean(showError('branch'))}
                      />
                      {showError('branch') && <span className="form-error">{showError('branch')}</span>}
                    </label>
                    <label className="form-field">
                      <span>Year of passout *</span>
                      <select
                        value={form.year}
                        onChange={(e) => setField('year', e.target.value)}
                        onBlur={() => markTouched('year')}
                        aria-invalid={Boolean(showError('year'))}
                      >
                        <option value="">Select a year</option>
                        {PASSOUT_YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      {showError('year') && <span className="form-error">{showError('year')}</span>}
                    </label>
                  </>
                )}
                {isEmployee && (
                  <>
                    <label className="form-field">
                      <span>Company name *</span>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) => setField('companyName', e.target.value)}
                        onBlur={() => markTouched('companyName')}
                        aria-invalid={Boolean(showError('companyName'))}
                      />
                      {showError('companyName') && <span className="form-error">{showError('companyName')}</span>}
                    </label>
                    <label className="form-field">
                      <span>Designation *</span>
                      <input
                        type="text"
                        value={form.designation}
                        onChange={(e) => setField('designation', e.target.value)}
                        onBlur={() => markTouched('designation')}
                        aria-invalid={Boolean(showError('designation'))}
                      />
                      {showError('designation') && <span className="form-error">{showError('designation')}</span>}
                    </label>
                    <label className="form-field">
                      <span>Years of experience</span>
                      <input
                        type="text"
                        value={form.yearsOfExperience}
                        onChange={(e) => setField('yearsOfExperience', e.target.value)}
                        placeholder="e.g. 2"
                      />
                    </label>
                  </>
                )}
                {isStudent && (
                  <>
                    <label className="form-field">
                      <span>College ID / enrollment number</span>
                      <input
                        type="text"
                        value={form.collegeId}
                        onChange={(e) => setField('collegeId', e.target.value)}
                      />
                    </label>
                    <label className="form-field">
                      <span>Group/club (if attending as one)</span>
                      <input
                        type="text"
                        value={form.groupName}
                        onChange={(e) => setField('groupName', e.target.value)}
                        placeholder="Leave blank if attending solo"
                      />
                    </label>
                  </>
                )}
                <label className="form-field">
                  <span>Date of birth *</span>
                  <input
                    type="date"
                    max={today}
                    value={form.dateOfBirth}
                    onChange={(e) => setField('dateOfBirth', e.target.value)}
                    onBlur={() => markTouched('dateOfBirth')}
                    autoComplete="bday"
                    aria-invalid={Boolean(showError('dateOfBirth'))}
                  />
                  {showError('dateOfBirth') && <span className="form-error">{showError('dateOfBirth')}</span>}
                </label>
                <label className="form-field">
                  <span>LinkedIn profile</span>
                  <input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) => setField('linkedinUrl', e.target.value)}
                    onBlur={() => markTouched('linkedinUrl')}
                    placeholder="https://linkedin.com/in/yourname"
                    aria-invalid={Boolean(showError('linkedinUrl'))}
                  />
                  {showError('linkedinUrl') && <span className="form-error">{showError('linkedinUrl')}</span>}
                </label>
              </div>
            </fieldset>

            <fieldset className="form-field-span register-section">
              <legend>Additional details (optional)</legend>
              <div className="auth-form-grid">
                <label className="form-field">
                  <span>How did you hear about this event?</span>
                  <select value={form.howHeard} onChange={(e) => setField('howHeard', e.target.value)}>
                    <option value="">Select an option</option>
                    <option value="Social media">Social media</option>
                    <option value="Friend/Classmate">Friend/Classmate</option>
                    <option value="College/University">College/University</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Email">Email</option>
                    <option value="Poster/Flyer">Poster/Flyer</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>T-shirt size</span>
                  <select
                    value={form.tshirtSize}
                    onChange={(e) => setField('tshirtSize', e.target.value as FormState['tshirtSize'])}
                  >
                    <option value="">Select a size</option>
                    {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const).map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Dietary preference / allergies</span>
                  <input
                    type="text"
                    value={form.dietaryPreference}
                    onChange={(e) => setField('dietaryPreference', e.target.value)}
                    placeholder="e.g. Vegetarian, nut allergy"
                  />
                </label>
                <label className="form-field">
                  <span>Emergency contact number</span>
                  <div className="phone-input-group">
                    <span className="phone-prefix" aria-hidden="true">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={form.emergencyContact.replace(/^\+91/, '')}
                      onChange={(e) =>
                        setField('emergencyContact', e.target.value ? `+91${e.target.value.replace(/\D/g, '').slice(0, 10)}` : '')
                      }
                      onBlur={() => markTouched('emergencyContact')}
                      placeholder="9876543210"
                      maxLength={10}
                      aria-invalid={Boolean(showError('emergencyContact'))}
                    />
                  </div>
                  {showError('emergencyContact') && (
                    <span className="form-error">{showError('emergencyContact')}</span>
                  )}
                </label>
              </div>
            </fieldset>

            <div className="form-field-span register-step-actions">
              <button type="button" className="btn-link" onClick={() => setPhase('plan')}>
                ← Change plan
              </button>
              <button type="submit" className="btn btn-primary" disabled={!formIsValid}>
                Continue →
              </button>
            </div>
          </form>
        )}

        {phase === 'summary' && (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <p className="form-error">{error}</p>}
            <dl className="register-summary">
              <div>
                <dt>Plan</dt>
                <dd>
                  {selectedPlan ? `${selectedPlan.name} — ${selectedPlan.currency} ${selectedPlan.price}` : '—'}
                </dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>{form.fullName}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{form.email}</dd>
              </div>
              <div>
                <dt>Mobile</dt>
                <dd>{form.phone}</dd>
              </div>
              <div>
                <dt>Profession</dt>
                <dd>
                  {isStudent
                    ? `Student — ${form.university}, ${form.department}${form.branch ? `, ${form.branch}` : ''}`
                    : `${form.designation} at ${form.companyName}`}
                </dd>
              </div>
            </dl>
            <button type="button" className="btn-link" onClick={() => setPhase('form')}>
              Edit details
            </button>

            <label className="form-field form-field-checkbox">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setField('consent', e.target.checked)}
              />
              <span>I agree to the event terms and to being contacted about this event.</span>
            </label>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !form.consent}>
              {submitting ? 'Creating account…' : 'Continue to payment →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
