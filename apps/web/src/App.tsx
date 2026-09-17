import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { Registration } from '@scd/types';
import { AuthProvider, useAuth } from './lib/auth.js';
import { ToastProvider } from './lib/toast.js';
import { useResource } from './lib/hooks.js';
import { Layout } from './components/Layout.js';
import { ErrorBoundary } from './components/ui/ErrorBoundary.js';
import { HomePage } from './pages/HomePage.js';
import { SpeakersPage } from './pages/SpeakersPage.js';
import { SpeakerDetailPage } from './pages/SpeakerDetailPage.js';
import { SessionsPage } from './pages/SessionsPage.js';
import { SessionDetailPage } from './pages/SessionDetailPage.js';
import { AgendaPage } from './pages/AgendaPage.js';
import { TimelinePage } from './pages/TimelinePage.js';
import { VenuePage } from './pages/VenuePage.js';
import { FaqPage } from './pages/FaqPage.js';
import { GalleryPage } from './pages/GalleryPage.js';
import { PastEventsPage } from './pages/PastEventsPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { VerifyEmailPage } from './pages/VerifyEmailPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { CompleteRegistrationPage } from './pages/CompleteRegistrationPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { MyAchievementsPage } from './pages/MyAchievementsPage.js';
import { MyCertificatePage } from './pages/MyCertificatePage.js';
import { EventWrappedPage } from './pages/EventWrappedPage.js';
import { SocialPostPage } from './pages/SocialPostPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

function RequireAttendee({ children }: { children: ReactElement }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking') {
    return (
      <div className="full-page-status">
        <p>Loading…</p>
      </div>
    );
  }
  if (status === 'signed-out') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

/**
 * The dashboard is unreachable until the attendee's registration is
 * CONFIRMED -- registering an account no longer grants dashboard access
 * on its own. Anyone else gets sent to /complete-registration, which
 * creates the registration if needed (confirmed immediately -- see
 * registrations.service.ts).
 */
function RequireConfirmedRegistration({ children }: { children: ReactElement }) {
  return (
    <RequireAttendee>
      <ConfirmedRegistrationGate>{children}</ConfirmedRegistrationGate>
    </RequireAttendee>
  );
}

function ConfirmedRegistrationGate({ children }: { children: ReactElement }) {
  const location = useLocation();
  const { data: registration, loading, notFound } = useResource<Registration>('/me/registration');
  if (loading) {
    return (
      <div className="full-page-status">
        <p>Loading…</p>
      </div>
    );
  }
  if (notFound || !registration || registration.status !== 'CONFIRMED') {
    return <Navigate to="/complete-registration" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="speakers" element={<SpeakersPage />} />
        <Route path="speakers/:id" element={<SpeakerDetailPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="sessions/:id" element={<SessionDetailPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        {/* Kept for anyone with the old link bookmarked/shared. */}
        <Route path="schedule" element={<Navigate to="/agenda" replace />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="venue" element={<VenuePage />} />
        <Route path="venues" element={<Navigate to="/venue" replace />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="past-events" element={<PastEventsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route
          path="complete-registration"
          element={
            <RequireAttendee>
              <CompleteRegistrationPage />
            </RequireAttendee>
          }
        />
        <Route
          path="dashboard"
          element={
            <RequireConfirmedRegistration>
              <DashboardPage />
            </RequireConfirmedRegistration>
          }
        />
        <Route
          path="dashboard/profile"
          element={
            <RequireConfirmedRegistration>
              <ProfilePage />
            </RequireConfirmedRegistration>
          }
        />
        <Route
          path="dashboard/achievements"
          element={
            <RequireConfirmedRegistration>
              <MyAchievementsPage />
            </RequireConfirmedRegistration>
          }
        />
        <Route
          path="dashboard/certificates"
          element={
            <RequireConfirmedRegistration>
              <MyCertificatePage />
            </RequireConfirmedRegistration>
          }
        />
        <Route
          path="dashboard/social-post"
          element={
            <RequireConfirmedRegistration>
              <SocialPostPage />
            </RequireConfirmedRegistration>
          }
        />
        <Route
          path="dashboard/wrapped"
          element={
            <RequireConfirmedRegistration>
              <EventWrappedPage />
            </RequireConfirmedRegistration>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
