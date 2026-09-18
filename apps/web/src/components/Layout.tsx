import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './layout/Header.js';
import { Footer } from './layout/Footer.js';
import { AnnouncementBanner } from './announcements/AnnouncementBanner.js';
import { AnnouncementPopup } from './announcements/AnnouncementPopup.js';
import { OfflineBanner } from './OfflineBanner.js';
import { initScrollReveal } from '../lib/scroll-reveal.js';

export function Layout() {
  const location = useLocation();

  // One scroll-reveal observer for the whole app, for the app's lifetime.
  useEffect(() => initScrollReveal(), []);

  return (
    <div className="site-shell">
      <OfflineBanner />
      <Header />
      <AnnouncementBanner />
      <AnnouncementPopup />
      <main id="main-content" className="site-main">
        {/* Keyed by path so each navigation replays the page-enter
            animation instead of only firing once on first mount. */}
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
