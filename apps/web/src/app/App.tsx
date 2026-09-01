import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/HomePage/HomePage';
import { RegistrationPage } from '../pages/RegistrationPage/RegistrationPage';
import { PaymentPage } from '../pages/PaymentPage/PaymentPage';
import { RegistrationSuccessPage } from '../pages/RegistrationSuccessPage/RegistrationSuccessPage';
import { MyTicketPage } from '../pages/MyTicketPage/MyTicketPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-light-lavender bg-blueprint-grid relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/registration/success" element={<RegistrationSuccessPage />} />
          <Route path="/ticket" element={<MyTicketPage />} />
          <Route path="/dashboard" element={<RegistrationSuccessPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};
