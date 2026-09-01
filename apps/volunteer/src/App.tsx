import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.js';
import { Layout } from './components/Layout.js';
import { LoginPage } from './pages/LoginPage.js';
import { CheckpointsPage } from './pages/CheckpointsPage.js';
import { CheckInPage } from './pages/CheckInPage.js';
import { HistoryPage } from './pages/HistoryPage.js';

function RequireVolunteer({ children }: { children: ReactElement }) {
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
          <RequireVolunteer>
            <Layout />
          </RequireVolunteer>
        }
      >
        <Route index element={<CheckpointsPage />} />
        <Route path="checkpoints/:id" element={<CheckInPage />} />
        <Route path="history" element={<HistoryPage />} />
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
