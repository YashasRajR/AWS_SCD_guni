import { useEffect, useState } from 'react';

/**
 * Wireframe 1l: "Offline banner — sits above the header. You're offline."
 * Purely a `navigator.onLine` + online/offline event listener -- no fake
 * "showing cached data" claim, since nothing here actually caches
 * responses; the banner just tells the person their connection dropped.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-banner" role="status">
      You&apos;re offline. Some information may be out of date until your connection comes back.
    </div>
  );
}
