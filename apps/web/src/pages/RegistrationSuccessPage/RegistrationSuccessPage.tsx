import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { TechnicalLabel } from '../../components/badges/TechnicalLabel';

export const RegistrationSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const registrationNumber = searchParams.get('registrationNumber') || 'SCD2026-REG-849201';
  const ticketNumber = searchParams.get('ticketNumber') || 'SCD2026-TKT-392019';

  return (
    <main className="min-h-screen pt-24 pb-30 px-6 sm:px-10 lg:px-16 max-w-3xl mx-auto text-center">
      <div className="mb-6 flex justify-center">
        <TechnicalLabel>CONFIRMED / PASSPORT ISSUED</TechnicalLabel>
      </div>

      <h1 className="text-5xl sm:text-7xl text-deep-purple mb-4">
        YOU ARE REGISTERED!
      </h1>
      <p className="font-technical text-sm text-accent-orange uppercase tracking-widest mb-10">
        // WELCOME TO AWS STUDENT COMMUNITY DAY 2026
      </p>

      <div className="bg-white border-2 border-primary-purple p-8 sm:p-12 shadow-[8px_8px_0_#50377A] space-y-6 text-left mb-10">
        <div className="border-b border-primary-purple/10 pb-4">
          <span className="block font-technical text-xs text-primary-purple/60 uppercase">REGISTRATION NUMBER</span>
          <span className="font-technical text-xl text-deep-purple font-bold">{registrationNumber}</span>
        </div>

        <div className="border-b border-primary-purple/10 pb-4">
          <span className="block font-technical text-xs text-primary-purple/60 uppercase">TICKET NUMBER</span>
          <span className="font-technical text-xl text-accent-orange font-bold">{ticketNumber}</span>
        </div>

        <div className="bg-light-lavender p-4 border border-primary-purple/20">
          <p className="font-body text-sm text-deep-purple/80">
            A confirmation email and digital ticket pass have been dispatched to your inbox. You can access your personalized dashboard at any time to view session progress and event certificates.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to={`/ticket?ticketNumber=${ticketNumber}&registrationNumber=${registrationNumber}`}
          className="bg-deep-purple hover:bg-primary-purple text-white px-8 py-4 font-display text-xl tracking-wider transition-all transform hover:-translate-y-1 hover:shadow-[4px_4px_0_#F28A45]"
        >
          VIEW DIGITAL TICKET →
        </Link>
        <Link
          to="/dashboard"
          className="bg-white border-2 border-primary-purple text-primary-purple hover:bg-light-lavender px-8 py-4 font-display text-xl tracking-wider transition-all"
        >
          GO TO DASHBOARD →
        </Link>
      </div>
    </main>
  );
};
