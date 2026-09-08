import { Outlet } from 'react-router-dom';
import { Header } from './layout/Header.js';
import { Footer } from './layout/Footer.js';
import { AnnouncementBanner } from './announcements/AnnouncementBanner.js';
import { AnnouncementPopup } from './announcements/AnnouncementPopup.js';
import { OfflineBanner } from './OfflineBanner.js';

export function Layout() {
  return (
    <div className="site-shell">
      <OfflineBanner />
      <Header />
      <AnnouncementBanner />
      <AnnouncementPopup />
      <main id="main-content" className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
