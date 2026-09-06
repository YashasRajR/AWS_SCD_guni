import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.js';
import { AdminLayout } from './components/AdminLayout.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { EventPage } from './pages/content/EventPage.js';
import { TicketPlansPage } from './pages/content/TicketPlansPage.js';
import { CouponsPage } from './pages/content/CouponsPage.js';
import { SpeakersPage } from './pages/content/SpeakersPage.js';
import { SessionsPage } from './pages/content/SessionsPage.js';
import { VenuesPage } from './pages/content/VenuesPage.js';
import { AgendaPage } from './pages/content/AgendaPage.js';
import { TimelinePage } from './pages/content/TimelinePage.js';
import { FaqsPage } from './pages/content/FaqsPage.js';
import { GalleryPage } from './pages/content/GalleryPage.js';
import { PastEventsPage } from './pages/content/PastEventsPage.js';
import { NavLinksPage } from './pages/content/NavLinksPage.js';
import { SocialLinksPage } from './pages/content/SocialLinksPage.js';
import { AnnouncementsPage } from './pages/content/AnnouncementsPage.js';
import { RegistrationsPage } from './pages/RegistrationsPage.js';
import { AttendeesPage } from './pages/AttendeesPage.js';
import { CheckpointsPage } from './pages/CheckpointsPage.js';
import { VolunteersPage } from './pages/VolunteersPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';
import { PaymentsPage } from './pages/PaymentsPage.js';
import { TicketsPage } from './pages/TicketsPage.js';
import { InvoicesPage } from './pages/InvoicesPage.js';
import { CertificatesPage } from './pages/CertificatesPage.js';
import { AchievementsPage } from './pages/AchievementsPage.js';
import { EmailsPage } from './pages/EmailsPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { SystemStatusPage } from './pages/SystemStatusPage.js';

function RequireAdmin({ children }: { children: ReactElement }) {
  const { status } = useAuth();
  if (status === 'checking') {
    return (
      <div className="full-page-status">
        <p>Loading…</p>
      </div>
    );
  }
  if (status === 'signed-out') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const { status } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={status === 'signed-in' ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="content/event" element={<EventPage />} />
        <Route path="content/ticket-plans" element={<TicketPlansPage />} />
        <Route path="content/coupons" element={<CouponsPage />} />
        <Route path="content/speakers" element={<SpeakersPage />} />
        <Route path="content/sessions" element={<SessionsPage />} />
        <Route path="content/venues" element={<VenuesPage />} />
        <Route path="content/agenda" element={<AgendaPage />} />
        <Route path="content/timeline" element={<TimelinePage />} />
        <Route path="content/faqs" element={<FaqsPage />} />
        <Route path="content/gallery" element={<GalleryPage />} />
        <Route path="content/past-events" element={<PastEventsPage />} />
        <Route path="content/nav-links" element={<NavLinksPage />} />
        <Route path="content/social-links" element={<SocialLinksPage />} />
        <Route path="content/announcements" element={<AnnouncementsPage />} />
        <Route path="registrations" element={<RegistrationsPage />} />
        <Route path="attendees" element={<AttendeesPage />} />
        <Route path="checkpoints" element={<CheckpointsPage />} />
        <Route path="volunteers" element={<VolunteersPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="emails" element={<EmailsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="system-status" element={<SystemStatusPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
