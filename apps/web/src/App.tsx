import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.js';
import { Layout } from './components/Layout.js';
import { HomePage } from './pages/HomePage.js';
import { SpeakersPage } from './pages/SpeakersPage.js';
import { SessionsPage } from './pages/SessionsPage.js';
import { SchedulePage } from './pages/SchedulePage.js';
import { TimelinePage } from './pages/TimelinePage.js';
import { VenuesPage } from './pages/VenuesPage.js';
import { FaqPage } from './pages/FaqPage.js';
import { AnnouncementsPage } from './pages/AnnouncementsPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';

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
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="venues" element={<VenuesPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="dashboard"
          element={
            <RequireAttendee>
              <DashboardPage />
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
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
