import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { TechnicalLabel } from '../../components/badges/TechnicalLabel';

export const MyTicketPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const ticketNumber = searchParams.get('ticketNumber') || 'SCD2026-TKT-392019';
  const registrationNumber = searchParams.get('registrationNumber') || 'SCD2026-REG-849201';

  return (
    <main className="min-h-screen pt-20 pb-28 px-6 sm:px-10 max-w-2xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <TechnicalLabel>OFFICIAL DELEGATE TICKET</TechnicalLabel>
        <span className="font-technical text-xs text-accent-orange font-bold">[ NO QR / MANUAL LOOKUP ]</span>
      </div>

      {/* Ticket Poster Component */}
      <div className="bg-white border-4 border-deep-purple p-8 sm:p-12 shadow-[12px_12px_0_#332052] relative overflow-hidden">
        {/* Editorial Header */}
        <div className="border-b-2 border-deep-purple pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <span className="font-technical text-xs text-primary-purple/70 tracking-widest block mb-1">
              GANPAT UNIVERSITY // MEHSANA
            </span>
            <h2 className="text-3xl sm:text-4xl text-deep-purple font-display leading-none">
              AWS STUDENT COMMUNITY DAY 2026
            </h2>
          </div>
          <div className="bg-deep-purple text-white px-3 py-1 font-technical text-xs tracking-widest">
            CONFIRMED
          </div>
        </div>

        {/* Ticket Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <span className="block font-technical text-[10px] text-primary-purple/60 uppercase">TICKET NUMBER</span>
            <span className="font-technical text-lg font-bold text-accent-orange">{ticketNumber}</span>
          </div>

          <div>
            <span className="block font-technical text-[10px] text-primary-purple/60 uppercase">REGISTRATION ID</span>
            <span className="font-technical text-lg font-bold text-deep-purple">{registrationNumber}</span>
          </div>

          <div>
            <span className="block font-technical text-[10px] text-primary-purple/60 uppercase">EVENT DATE</span>
            <span className="font-body text-base font-semibold text-deep-purple">SEPTEMBER 2026</span>
          </div>

          <div>
            <span className="block font-technical text-[10px] text-primary-purple/60 uppercase">VENUE</span>
            <span className="font-body text-base font-semibold text-deep-purple">MAIN AUDITORIUM, GUNI CAMPUS</span>
          </div>
        </div>

        {/* Notice & Instructions */}
        <div className="border-t-2 border-dashed border-primary-purple/30 pt-6">
          <h4 className="font-technical text-xs text-deep-purple uppercase tracking-wider mb-2">ENTRY INSTRUCTIONS:</h4>
          <ul className="font-body text-xs text-primary-purple/80 space-y-1 list-disc list-inside">
            <li>Present this ticket number or your registered email at the entry checkpoint.</li>
            <li>Volunteers will verify your identity manually at the registration desk.</li>
            <li>Ensure you bring your valid Ganpat University student photo ID card.</li>
          </ul>
        </div>

        {/* Decorative Stamp */}
        <div className="mt-8 pt-4 border-t border-primary-purple/10 flex justify-between items-center text-[10px] font-technical text-primary-purple/50">
          <span>ISSUED BY AWS STUDENT BUILDER GROUP</span>
          <span>AUTHENTICITY VERIFIED</span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => window.print()}
          className="bg-white border-2 border-primary-purple text-primary-purple hover:bg-light-lavender px-6 py-3 font-display text-lg tracking-wider transition-all"
        >
          PRINT / SAVE TICKET PDF
        </button>
      </div>
    </main>
  );
};
