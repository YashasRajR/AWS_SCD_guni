import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.js';
import { Layout } from './components/Layout.js';
import { ErrorBoundary } from './components/ui/ErrorBoundary.js';
import { HomePage } from './pages/HomePage.js';
import { SpeakersPage } from './pages/SpeakersPage.js';
import { SessionsPage } from './pages/SessionsPage.js';
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
import { ProfilePage } from './pages/ProfilePage.js';
import { MyAchievementsPage } from './pages/MyAchievementsPage.js';
import { MyCertificatePage } from './pages/MyCertificatePage.js';
import { EventWrappedPage } from './pages/EventWrappedPage.js';

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

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="speakers" element={<SpeakersPage />} />
        <Route path="sessions" element={<SessionsPage />} />
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
          path="dashboard"
          element={
            <RequireAttendee>
              <DashboardPage />
            </RequireAttendee>
          }
        />
        <Route
          path="dashboard/profile"
          element={
            <RequireAttendee>
              <ProfilePage />
            </RequireAttendee>
          }
        />
        <Route
          path="dashboard/achievements"
          element={
            <RequireAttendee>
              <MyAchievementsPage />
            </RequireAttendee>
          }
        />
        <Route
          path="dashboard/certificates"
          element={
            <RequireAttendee>
              <MyCertificatePage />
            </RequireAttendee>
          }
        />
        <Route
          path="dashboard/wrapped"
          element={
            <RequireAttendee>
              <EventWrappedPage />
            </RequireAttendee>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
