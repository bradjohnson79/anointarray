// Temporarily disabled service worker to fix auth issues
console.log('[SW] Service worker is temporarily disabled');

// Remove all caches
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Removing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] All caches cleared');
      return self.clients.claim();
    })
  );
});

// Don't intercept any fetch requests
self.addEventListener('fetch', (event) => {
  // Let all requests pass through to network
  return;
});