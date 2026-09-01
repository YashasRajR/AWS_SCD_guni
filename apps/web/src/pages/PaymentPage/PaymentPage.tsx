import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TechnicalLabel } from '../../components/badges/TechnicalLabel';

export const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const registrationId = searchParams.get('registrationId') || 'REG-MOCK';
  const amount = searchParams.get('amount') || '500';
  const [processing, setProcessing] = useState(false);

  const handleSimulatePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      const mockRegNum = `SCD2026-REG-${Math.floor(100000 + Math.random() * 900000)}`;
      const mockTktNum = `SCD2026-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      navigate(`/registration/success?registrationNumber=${mockRegNum}&ticketNumber=${mockTktNum}`);
    }, 1500);
  };

  return (
    <main className="min-h-screen pt-24 pb-30 px-6 max-w-xl mx-auto text-center">
      <div className="mb-6 flex justify-center">
        <TechnicalLabel>CHECKOUT / PAYMENT GATEWAY</TechnicalLabel>
      </div>

      <h1 className="text-4xl sm:text-5xl text-deep-purple mb-4">
        COMPLETE PAYMENT
      </h1>
      <p className="font-technical text-xs text-primary-purple/70 uppercase tracking-widest mb-8">
        REGISTRATION ID: {registrationId}
      </p>

      <div className="bg-white border-2 border-primary-purple p-8 shadow-[8px_8px_0_#50377A] space-y-6 text-left mb-8">
        <div className="flex justify-between items-center border-b border-primary-purple/10 pb-4">
          <span className="font-body text-base text-deep-purple">Delegate Pass Fee:</span>
          <span className="font-technical text-2xl font-bold text-accent-orange">₹{amount}.00 INR</span>
        </div>

        <div className="bg-light-lavender p-4 border border-primary-purple/20">
          <span className="font-technical text-xs text-primary-purple/70 block mb-1">[GATEWAY INTEGRATION STATUS]</span>
          <p className="font-body text-xs text-deep-purple/80">
            Payment provider environment is configured in mock/development mode. Click below to simulate instant payment verification and ticket issuance.
          </p>
        </div>
      </div>

      <button
        onClick={handleSimulatePayment}
        disabled={processing}
        className="w-full bg-deep-purple hover:bg-primary-purple text-white px-8 py-4 font-display text-xl tracking-wider transition-all transform hover:-translate-y-1 hover:shadow-[4px_4px_0_#F28A45] disabled:opacity-50"
      >
        {processing ? 'VERIFYING PAYMENT...' : `PAY ₹${amount} & CONFIRM TICKET →`}
      </button>
    </main>
  );
};
