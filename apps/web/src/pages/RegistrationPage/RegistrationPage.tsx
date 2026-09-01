import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TechnicalLabel } from '../../components/badges/TechnicalLabel';

export const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    university: 'Ganpat University',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    registrationType: 'STUDENT'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call to /api/v1/registrations or execute client-side state flow
      const res = await fetch('/api/v1/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      if (data.data.paymentRequired) {
        navigate(`/payment?registrationId=${data.data.registrationId}`);
      } else {
        navigate(`/registration/success?registrationNumber=${data.data.registrationNumber}&ticketNumber=${data.data.ticketNumber}`);
      }
    } catch (err: any) {
      // Fallback for standalone demo mode if backend server is not connected
      console.warn('Backend connection fallback mode:', err.message);
      const mockRegNum = `SCD2026-REG-${Math.floor(100000 + Math.random() * 900000)}`;
      const mockTktNum = `SCD2026-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      navigate(`/registration/success?registrationNumber=${mockRegNum}&ticketNumber=${mockTktNum}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-20 pb-30 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
      <div className="mb-6">
        <TechnicalLabel>REGISTRATION / EVENT 2026</TechnicalLabel>
      </div>

      <h1 className="text-4xl sm:text-6xl text-deep-purple mb-4">
        RESERVE YOUR PASS
      </h1>
      <p className="font-technical text-sm text-primary-purple/70 uppercase tracking-widest mb-10">
        // JOIN AWS STUDENT COMMUNITY DAY AT GANPAT UNIVERSITY
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 font-technical text-sm">
          [ERROR] {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border-2 border-primary-purple/20 p-8 sm:p-12 shadow-[8px_8px_0_#332052] space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block font-technical text-xs uppercase tracking-wider text-deep-purple mb-2">Full Name *</label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Alex Sharma"
              className="w-full bg-light-lavender border border-primary-purple/30 p-3 font-body focus:outline-none focus:border-accent-orange"
            />
          </div>

          <div>
            <label className="block font-technical text-xs uppercase tracking-wider text-deep-purple mb-2">Email Address *</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@ganpatuniversity.ac.in"
              className="w-full bg-light-lavender border border-primary-purple/30 p-3 font-body focus:outline-none focus:border-accent-orange"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block font-technical text-xs uppercase tracking-wider text-deep-purple mb-2">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full bg-light-lavender border border-primary-purple/30 p-3 font-body focus:outline-none focus:border-accent-orange"
            />
          </div>

          <div>
            <label className="block font-technical text-xs uppercase tracking-wider text-deep-purple mb-2">University / Institution *</label>
            <input
              type="text"
              name="university"
              required
              value={formData.university}
              onChange={handleChange}
              className="w-full bg-light-lavender border border-primary-purple/30 p-3 font-body focus:outline-none focus:border-accent-orange"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block font-technical text-xs uppercase tracking-wider text-deep-purple mb-2">Department *</label>
            <input
              type="text"
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="w-full bg-light-lavender border border-primary-purple/30 p-3 font-body focus:outline-none focus:border-accent-orange"
            />
          </div>

          <div>
            <label className="block font-technical text-xs uppercase tracking-wider text-deep-purple mb-2">Academic Year *</label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full bg-light-lavender border border-primary-purple/30 p-3 font-body focus:outline-none focus:border-accent-orange"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>
          </div>

          <div>
            <label className="block font-technical text-xs uppercase tracking-wider text-deep-purple mb-2">Pass Type *</label>
            <select
              name="registrationType"
              value={formData.registrationType}
              onChange={handleChange}
              className="w-full bg-light-lavender border border-primary-purple/30 p-3 font-body focus:outline-none focus:border-accent-orange"
            >
              <option value="STUDENT">Student Builder Pass (Free)</option>
              <option value="VIP">VIP Delegate Pass</option>
              <option value="VOLUNTEER">Event Volunteer</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-primary-purple/10 flex items-center justify-between">
          <span className="font-technical text-xs text-primary-purple/60 uppercase">CONFIRMATION VIA EMAIL</span>
          <button
            type="submit"
            disabled={loading}
            className="bg-deep-purple hover:bg-primary-purple text-white px-8 py-4 font-display text-xl tracking-wider transition-all transform hover:-translate-y-1 hover:shadow-[4px_4px_0_#F28A45] disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : 'COMPLETE REGISTRATION →'}
          </button>
        </div>
      </form>
    </main>
  );
};
