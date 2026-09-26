import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/auth.js';
import { ToastProvider } from './lib/toast.js';
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
import { RegisterPage } from './pages/RegisterPage.js';
import { SocialPostPage } from './pages/SocialPostPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

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
        <Route path="social-post" element={<SocialPostPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="login" element={<Navigate to="/" replace />} />
        <Route path="forgot-password" element={<Navigate to="/" replace />} />
        <Route path="reset-password" element={<Navigate to="/" replace />} />
        <Route path="verify-email" element={<Navigate to="/" replace />} />
        <Route path="complete-registration" element={<Navigate to="/register" replace />} />
        <Route path="dashboard/social-post" element={<Navigate to="/social-post" replace />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="dashboard/*" element={<Navigate to="/" replace />} />
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
