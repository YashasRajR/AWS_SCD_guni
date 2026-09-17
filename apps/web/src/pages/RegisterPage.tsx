import { useState, useMemo, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { emailSchema, passwordSchema, phoneSchema } from '@scd/validation';
import { useAuth } from '../lib/auth.js';
import { useDocumentHead } from '../lib/seo.js';
import { PasswordInput } from '../components/ui/PasswordInput.js';
import { Mascot } from '../components/ui/Mascot.js';

const CURRENT_YEAR = new Date().getFullYear();
const PASSOUT_YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => String(CURRENT_YEAR - 1 + i));
const today = new Date().toISOString().slice(0, 10);

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  registrationType: 'STUDENT' | 'PROFESSIONAL';
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
  codeOfConduct: boolean;
  consent: boolean;
}

const INITIAL_STATE: FormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '+91',
  dateOfBirth: '2004-01-01',
  registrationType: 'STUDENT',
  university: 'Ganpat University',
  department: 'Computer Science & Engineering',
  branch: 'Cloud & AI',
  year: String(CURRENT_YEAR + 1),
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
  codeOfConduct: true,
  consent: true,
};

type Step = 1 | 2 | 3 | 'success';

function calculatePasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: 'none', color: '#9a958c' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/\d/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) return { score: 1, label: 'weak', color: '#b3261e' };
  if (score <= 3) return { score: 2, label: 'medium', color: '#FF9900' };
  return { score: 3, label: 'strong', color: '#2e7d32' };
}

export function RegisterPage() {
  useDocumentHead({ title: 'Register Free · AWS SCD 2026' });
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{ name: string; regNo: string } | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const markTouched = (key: keyof FormState) =>
    setTouched((prev) => ({ ...prev, [key]: true }));

  const strength = useMemo(() => calculatePasswordStrength(form.password), [form.password]);

  // Validation
  const step1Errors: Record<string, string> = {};
  if (!form.fullName.trim() || form.fullName.trim().length < 2) step1Errors.fullName = 'Enter your full name.';
  if (!emailSchema.safeParse(form.email).success) step1Errors.email = 'Enter a valid email address.';
  if (!passwordSchema.safeParse(form.password).success) step1Errors.password = 'Use at least 8 characters with letters & numbers.';
  if (form.password !== form.confirmPassword) step1Errors.confirmPassword = 'Passwords do not match.';
  if (!form.codeOfConduct) step1Errors.codeOfConduct = 'You must agree to the code of conduct.';

  const step2Errors: Record<string, string> = {};
  if (!phoneSchema.safeParse(form.phone.trim()).success) step2Errors.phone = 'Enter a valid Indian mobile number, e.g. +919876543210.';
  if (!form.dateOfBirth || form.dateOfBirth > today) step2Errors.dateOfBirth = 'Enter a valid date of birth.';
  if (form.registrationType === 'STUDENT') {
    if (!form.university.trim()) step2Errors.university = 'Enter college/university name.';
    if (!form.department.trim()) step2Errors.department = 'Enter department / faculty.';
    if (!form.branch.trim()) step2Errors.branch = 'Enter your branch or stream.';
    if (!form.year.trim()) step2Errors.year = 'Select year of passout.';
  } else {
    if (!form.companyName.trim()) step2Errors.companyName = 'Enter company name.';
    if (!form.designation.trim()) step2Errors.designation = 'Enter designation.';
  }

  const handleStep1Submit = (e: FormEvent) => {
    e.preventDefault();
    if (Object.keys(step1Errors).length > 0) {
      setTouched((prev) => ({ ...prev, fullName: true, email: true, password: true, confirmPassword: true, codeOfConduct: true }));
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e: FormEvent) => {
    e.preventDefault();
    if (Object.keys(step2Errors).length > 0) {
      setTouched((prev) => ({ ...prev, phone: true, dateOfBirth: true, university: true, department: true, branch: true, year: true, companyName: true, designation: true }));
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone.trim(),
        registrationType: form.registrationType,
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

      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      setRegistrationResult({
        name: form.fullName,
        regNo: `SCD26-${randomDigits}`,
      });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section" style={{ padding: '32px 0 60px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px' }}>
        <p className="mo" style={{ color: 'var(--scd-muted)', marginBottom: '16px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> / Register
        </p>

        {/* Stepper Navigation */}
        <div className="r" style={{ gap: '8px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`chip ${step === 1 ? 'on' : ''}`}
            onClick={() => step !== 'success' && setStep(1)}
            style={{ cursor: step !== 'success' ? 'pointer' : 'default', border: '1px solid var(--scd-fg)' }}
          >
            1 Account
          </button>
          <span className="mo" style={{ color: 'var(--scd-muted)' }}>—</span>
          <button
            type="button"
            className={`chip ${step === 2 ? 'on' : ''}`}
            onClick={() => step !== 'success' && Object.keys(step1Errors).length === 0 && setStep(2)}
            style={{ cursor: step !== 'success' && Object.keys(step1Errors).length === 0 ? 'pointer' : 'default', border: '1px solid var(--scd-fg)' }}
          >
            2 {form.registrationType === 'STUDENT' ? 'Student details' : 'Professional details'}
          </button>
          <span className="mo" style={{ color: 'var(--scd-muted)' }}>—</span>
          <button
            type="button"
            className={`chip ${step === 3 ? 'on' : ''}`}
            onClick={() => step !== 'success' && Object.keys(step1Errors).length === 0 && Object.keys(step2Errors).length === 0 && setStep(3)}
            style={{ cursor: step !== 'success' && Object.keys(step1Errors).length === 0 && Object.keys(step2Errors).length === 0 ? 'pointer' : 'default', border: '1px solid var(--scd-fg)' }}
          >
            3 Confirm
          </button>
        </div>

        {/* Split Layout: Left Form / Right Inverted Mascot Panel (Wireframe 1g) */}
        <div className="register-split-grid" style={{ display: 'flex', gap: 0, border: '1.5px solid var(--scd-primary)', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
          {/* Left Form Column */}
          <div style={{ flex: '1.3 1 360px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h1 className="d2" style={{ margin: 0, fontSize: '26px' }}>
              {step === 'success' ? 'Registration confirmed!' : 'Register free'}
            </h1>
            <p className="tx" style={{ color: 'var(--scd-muted)', fontSize: '13px' }}>
              AWS Students Community Day 2026 · 8 October 2026 · Ganpat University
            </p>

            {error && (
              <div className="k" style={{ borderColor: '#b3261e', background: '#fdf2f2', padding: '12px' }}>
                <p className="mo" style={{ color: '#b3261e' }}>Error</p>
                <p className="tx" style={{ color: '#b3261e', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            {/* STEP 1: ACCOUNT */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="c" style={{ gap: '16px' }}>
                <div className="k" style={{ gap: '12px', padding: '16px' }}>
                  {/* Full Name */}
                  <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                    <label className="mo" style={{ fontSize: '11px' }}>Full name *</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setField('fullName', e.target.value)}
                      onBlur={() => markTouched('fullName')}
                      placeholder="e.g. Riya Patel"
                      style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                      required
                    />
                    {touched.fullName && step1Errors.fullName && (
                      <p className="tx" style={{ color: '#b3261e', fontSize: '11px' }}>{step1Errors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                    <label className="mo" style={{ fontSize: '11px' }}>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      onBlur={() => markTouched('email')}
                      placeholder="e.g. riya@example.com"
                      style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                      required
                    />
                    {touched.email && step1Errors.email && (
                      <p className="tx" style={{ color: '#b3261e', fontSize: '11px' }}>{step1Errors.email}</p>
                    )}
                  </div>

                  {/* Password + Strength Meter */}
                  <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                    <label className="mo" style={{ fontSize: '11px' }}>Password *</label>
                    <PasswordInput
                      value={form.password}
                      onChange={(e) => setField('password', e.target.value)}
                      placeholder="At least 8 chars with letters & numbers"
                      autoComplete="new-password"
                    />
                    {form.password && (
                      <div className="r" style={{ gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                        <div style={{ flex: 1, height: '4px', background: 'var(--scd-border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${(strength.score / 3) * 100}%`,
                              height: '100%',
                              backgroundColor: strength.color,
                              transition: 'width 0.2s ease',
                            }}
                          />
                        </div>
                        <span className="mo" style={{ fontSize: '10px', color: strength.color }}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                    {touched.password && step1Errors.password && (
                      <p className="tx" style={{ color: '#b3261e', fontSize: '11px' }}>{step1Errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                    <label className="mo" style={{ fontSize: '11px' }}>Confirm password *</label>
                    <PasswordInput
                      value={form.confirmPassword}
                      onChange={(e) => setField('confirmPassword', e.target.value)}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                    />
                    {touched.confirmPassword && step1Errors.confirmPassword && (
                      <p className="tx" style={{ color: '#b3261e', fontSize: '11px' }}>{step1Errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Code of Conduct Checkbox */}
                  <label className="r" style={{ gap: '8px', cursor: 'pointer', alignItems: 'flex-start', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={form.codeOfConduct}
                      onChange={(e) => setField('codeOfConduct', e.target.checked)}
                      style={{ marginTop: '3px' }}
                    />
                    <span className="tx" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                      I agree to the AWS Community Code of Conduct and commit to a welcoming, respectful environment.
                    </span>
                  </label>
                </div>

                <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
                    Step 1 of 3
                  </p>
                  <button
                    type="submit"
                    className="btn o"
                    style={{ minHeight: '44px', padding: '0 24px', cursor: 'pointer' }}
                  >
                    Continue to details →
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="c" style={{ gap: '16px' }}>
                <div className="k" style={{ gap: '12px', padding: '16px' }}>
                  {/* Registration Type Toggle */}
                  <div className="kd" style={{ background: '#fff', gap: '6px' }}>
                    <label className="mo" style={{ fontSize: '11px' }}>I am a *</label>
                    <div className="r" style={{ gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setField('registrationType', 'STUDENT')}
                        className={`chip ${form.registrationType === 'STUDENT' ? 'on' : ''}`}
                        style={{ flex: 1, padding: '8px', cursor: 'pointer', border: '1px solid var(--scd-fg)' }}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setField('registrationType', 'PROFESSIONAL')}
                        className={`chip ${form.registrationType === 'PROFESSIONAL' ? 'on' : ''}`}
                        style={{ flex: 1, padding: '8px', cursor: 'pointer', border: '1px solid var(--scd-fg)' }}
                      >
                        Working Professional
                      </button>
                    </div>
                  </div>

                  {form.registrationType === 'STUDENT' ? (
                    <>
                      <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                        <label className="mo" style={{ fontSize: '11px' }}>College / University *</label>
                        <input
                          type="text"
                          value={form.university}
                          onChange={(e) => setField('university', e.target.value)}
                          onBlur={() => markTouched('university')}
                          placeholder="e.g. Ganpat University"
                          style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                          required
                        />
                        {touched.university && step2Errors.university && (
                          <p className="tx" style={{ color: '#b3261e', fontSize: '11px' }}>{step2Errors.university}</p>
                        )}
                      </div>

                      <div className="r" style={{ gap: '8px', flexWrap: 'wrap' }}>
                        <div className="kd" style={{ flex: 1, background: '#fff', gap: '4px', minWidth: '140px' }}>
                          <label className="mo" style={{ fontSize: '11px' }}>Department *</label>
                          <input
                            type="text"
                            value={form.department}
                            onChange={(e) => setField('department', e.target.value)}
                            onBlur={() => markTouched('department')}
                            placeholder="e.g. Computer Science"
                            style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                            required
                          />
                        </div>
                        <div className="kd" style={{ flex: 1, background: '#fff', gap: '4px', minWidth: '140px' }}>
                          <label className="mo" style={{ fontSize: '11px' }}>Branch *</label>
                          <input
                            type="text"
                            value={form.branch}
                            onChange={(e) => setField('branch', e.target.value)}
                            onBlur={() => markTouched('branch')}
                            placeholder="e.g. Cloud & AI"
                            style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                            required
                          />
                        </div>
                      </div>

                      <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                        <label className="mo" style={{ fontSize: '11px' }}>Year of passout *</label>
                        <select
                          value={form.year}
                          onChange={(e) => setField('year', e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                        >
                          {PASSOUT_YEAR_OPTIONS.map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="r" style={{ gap: '8px', flexWrap: 'wrap' }}>
                        <div className="kd" style={{ flex: 1, background: '#fff', gap: '4px', minWidth: '140px' }}>
                          <label className="mo" style={{ fontSize: '11px' }}>College ID / Enrollment</label>
                          <input
                            type="text"
                            value={form.collegeId}
                            onChange={(e) => setField('collegeId', e.target.value)}
                            placeholder="Optional enrollment no."
                            style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                          />
                        </div>
                        <div className="kd" style={{ flex: 1, background: '#fff', gap: '4px', minWidth: '140px' }}>
                          <label className="mo" style={{ fontSize: '11px' }}>Club / Group</label>
                          <input
                            type="text"
                            value={form.groupName}
                            onChange={(e) => setField('groupName', e.target.value)}
                            placeholder="e.g. AWS Cloud Club"
                            style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="kd" style={{ background: '#fff', gap: '4px' }}>
                        <label className="mo" style={{ fontSize: '11px' }}>Company / Organization *</label>
                        <input
                          type="text"
                          value={form.companyName}
                          onChange={(e) => setField('companyName', e.target.value)}
                          onBlur={() => markTouched('companyName')}
                          placeholder="e.g. Amazon Web Services"
                          style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                          required
                        />
                      </div>
                      <div className="r" style={{ gap: '8px', flexWrap: 'wrap' }}>
                        <div className="kd" style={{ flex: 1, background: '#fff', gap: '4px', minWidth: '140px' }}>
                          <label className="mo" style={{ fontSize: '11px' }}>Designation *</label>
                          <input
                            type="text"
                            value={form.designation}
                            onChange={(e) => setField('designation', e.target.value)}
                            onBlur={() => markTouched('designation')}
                            placeholder="e.g. Cloud Architect"
                            style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                            required
                          />
                        </div>
                        <div className="kd" style={{ flex: 1, background: '#fff', gap: '4px', minWidth: '140px' }}>
                          <label className="mo" style={{ fontSize: '11px' }}>Years of Experience</label>
                          <input
                            type="text"
                            value={form.yearsOfExperience}
                            onChange={(e) => setField('yearsOfExperience', e.target.value)}
                            placeholder="e.g. 3"
                            style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Phone + DOB */}
                  <div className="r" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    <div className="kd" style={{ flex: 1, background: '#fff', gap: '4px', minWidth: '140px' }}>
                      <label className="mo" style={{ fontSize: '11px' }}>Mobile number (+91) *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        onBlur={() => markTouched('phone')}
                        placeholder="+919876543210"
                        style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                        required
                      />
                      {touched.phone && step2Errors.phone && (
                        <p className="tx" style={{ color: '#b3261e', fontSize: '11px' }}>{step2Errors.phone}</p>
                      )}
                    </div>
                    <div className="kd" style={{ flex: 1, background: '#fff', gap: '4px', minWidth: '140px' }}>
                      <label className="mo" style={{ fontSize: '11px' }}>Date of birth *</label>
                      <input
                        type="date"
                        max={today}
                        value={form.dateOfBirth}
                        onChange={(e) => setField('dateOfBirth', e.target.value)}
                        style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                        required
                      />
                    </div>
                  </div>

                  {/* Optional Preferences: T-shirt & How heard */}
                  <div className="r" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    <div className="kd" style={{ flex: 1, background: '#fff', gap: '4px', minWidth: '140px' }}>
                      <label className="mo" style={{ fontSize: '11px' }}>T-shirt Size (optional)</label>
                      <select
                        value={form.tshirtSize}
                        onChange={(e) => setField('tshirtSize', e.target.value as FormState['tshirtSize'])}
                        style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                      >
                        <option value="">Select size</option>
                        {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                    </div>
                    <div className="kd" style={{ flex: 1, background: '#fff', gap: '4px', minWidth: '140px' }}>
                      <label className="mo" style={{ fontSize: '11px' }}>How did you hear?</label>
                      <select
                        value={form.howHeard}
                        onChange={(e) => setField('howHeard', e.target.value)}
                        style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '14px', background: 'transparent' }}
                      >
                        <option value="">Select source</option>
                        <option value="Social media">Social media</option>
                        <option value="Friend/Classmate">Friend/Classmate</option>
                        <option value="College/University">College/University</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="r" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={() => setStep(1)} className="btn g" style={{ minHeight: '44px' }}>
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="btn o"
                    style={{ minHeight: '44px', padding: '0 24px', cursor: 'pointer' }}
                  >
                    Continue to review →
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: CONFIRMATION & REVIEW */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="c" style={{ gap: '16px' }}>
                <div className="k" style={{ padding: '16px', gap: '12px' }}>
                  <p className="mo" style={{ color: 'var(--scd-accent)', fontWeight: 700 }}>Review details</p>

                  <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="c" style={{ gap: '2px' }}>
                      <p className="mo" style={{ fontSize: '10px', color: 'var(--scd-muted)' }}>Name &amp; Email</p>
                      <p className="lbl">{form.fullName}</p>
                      <p className="mo" style={{ color: 'var(--scd-muted)' }}>{form.email}</p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="btn g" style={{ fontSize: '10px', padding: '3px 8px' }}>
                      Edit
                    </button>
                  </div>

                  <hr className="rule" style={{ height: '1px', background: 'var(--scd-border)', border: 0, margin: '2px 0' }} />

                  <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="c" style={{ gap: '2px' }}>
                      <p className="mo" style={{ fontSize: '10px', color: 'var(--scd-muted)' }}>Role &amp; Affiliation</p>
                      <p className="lbl">
                        {form.registrationType === 'STUDENT'
                          ? `Student · ${form.university}`
                          : `${form.designation} · ${form.companyName}`}
                      </p>
                      <p className="mo" style={{ color: 'var(--scd-muted)' }}>
                        {form.registrationType === 'STUDENT' ? `${form.branch} (${form.year})` : form.companyName}
                      </p>
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="btn g" style={{ fontSize: '10px', padding: '3px 8px' }}>
                      Edit
                    </button>
                  </div>

                  <div className="kd" style={{ background: 'var(--scd-surface-muted)' }}>
                    <p className="mo" style={{ fontSize: '10px' }}>Event Access</p>
                    <p className="lbl">AWS Students Community Day 2026 · Free Entry Pass</p>
                  </div>
                </div>

                <div className="r" style={{ gap: '12px', alignItems: 'center' }}>
                  <button
                    type="submit"
                    className="btn o"
                    disabled={submitting}
                    style={{ minHeight: '44px', padding: '0 24px', cursor: submitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {submitting ? 'Confirming registration…' : 'Confirm registration →'}
                  </button>
                  <button type="button" onClick={() => setStep(2)} className="btn g" style={{ minHeight: '44px' }}>
                    ← Back
                  </button>
                </div>
              </form>
            )}

            {/* SUCCESS: CONFETTI + TICKET CARD */}
            {step === 'success' && registrationResult && (
              <div className="c" style={{ gap: '20px', position: 'relative' }}>
                {/* 30 Confetti particles simulation */}
                <div style={{ position: 'relative', height: '30px', overflow: 'hidden', pointerEvents: 'none' }}>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="confetti-particle"
                      style={{
                        left: `${(i * 3.3) % 100}%`,
                        backgroundColor: ['#FF9900', '#232F3E', '#16191F', '#B36200'][i % 4],
                        animationDelay: `${(i * 45) % 800}ms`,
                      }}
                    />
                  ))}
                </div>

                {/* Wireframe 1g Ticket Card */}
                <div className="k" style={{ border: '2px solid var(--scd-primary)', padding: '20px', gap: '14px', background: 'var(--scd-surface)' }}>
                  <div className="r" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="c" style={{ gap: '4px' }}>
                      <p className="mo" style={{ color: 'var(--scd-accent)', fontWeight: 700 }}>OFFICIAL EVENT TICKET</p>
                      <h2 className="d2" style={{ margin: 0, fontSize: '22px' }}>{registrationResult.name}</h2>
                      <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '13px' }}>
                        Reg. no. {registrationResult.regNo}
                      </p>
                      <p className="tx" style={{ fontSize: '12px' }}>
                        {form.university} · {form.branch}
                      </p>
                    </div>
                    <span className="chip on" style={{ fontSize: '11px' }}>Confirmed</span>
                  </div>

                  <hr className="rule" style={{ height: '1.5px', background: 'var(--scd-accent)', border: 0, margin: '4px 0' }} />

                  <div className="r" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    <div className="kd" style={{ flex: 1, padding: '6px 8px' }}>
                      <p className="mo" style={{ fontSize: '10px' }}>Date</p>
                      <p className="lbl" style={{ fontSize: '12px' }}>8 Oct 2026</p>
                    </div>
                    <div className="kd" style={{ flex: 1, padding: '6px 8px' }}>
                      <p className="mo" style={{ fontSize: '10px' }}>Check-in</p>
                      <p className="lbl" style={{ fontSize: '12px' }}>09:00 AM</p>
                    </div>
                    <div className="kd" style={{ flex: 1, padding: '6px 8px' }}>
                      <p className="mo" style={{ fontSize: '10px' }}>Venue</p>
                      <p className="lbl" style={{ fontSize: '12px' }}>CoE, GUNI</p>
                    </div>
                  </div>

                  <p className="mo" style={{ fontSize: '11px', color: 'var(--scd-muted)' }}>
                    Show your name and reg. no. at the check-in desk upon arrival. No paper ticket needed.
                  </p>
                </div>

                <div className="r" style={{ gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="btn o"
                    style={{ minHeight: '44px', padding: '0 24px', cursor: 'pointer' }}
                  >
                    Go to student dashboard →
                  </button>
                  <Link to="/agenda" className="btn g" style={{ minHeight: '44px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    Explore agenda
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Inverted Mascot Panel (Wireframe 1g) */}
          <div
            className="register-split-aside wb inv"
            style={{
              flex: '1 1 280px',
              background: 'var(--scd-primary)',
              color: '#fff',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderLeft: '1.5px solid var(--scd-primary)',
            }}
          >
            <div className="c" style={{ gap: '10px' }}>
              <p className="mo" style={{ color: 'var(--scd-accent)' }}>AWS SCD 2026</p>
              <h2 className="d1" style={{ fontSize: '28px', color: '#fff', margin: 0 }}>
                One day.<br />Real cloud.
              </h2>
              <p className="tx" style={{ color: '#cfc9be', fontSize: '13px', lineHeight: 1.5 }}>
                Free entry, limited seats. Learn from certified architects, build in hands-on labs, and earn recognized certificates.
              </p>
            </div>

            <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
              <Mascot variant="wave" size={140} />
            </div>

            <div className="c" style={{ gap: '4px' }}>
              <p className="mo" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                Ganpat University · Mehsana
              </p>
              <p className="mo" style={{ fontSize: '10px', color: 'var(--scd-accent)' }}>
                @aws.sbg_guni
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
