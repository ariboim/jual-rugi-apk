// Service Worker JualRugi.my.id (Network-First Cache Buster v8)
const CACHE_NAME = 'jualrugi-v8-pwa-ogfix';

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/og-image.png',
  '/logo_icon.png',
  '/logo_transparent.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/favicon.ico',
  '/icon.svg',
  '/image_3.png',
  '/banner-hp-jualrugi.png'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 1. Install Event: Skip waiting segera agar update langsung aktif
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW Precache Warning]:', err);
      });
    })
  );
});

// 2. Activate Event: Hapus SEMUA cache versi lama dari memori HP pengguna
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW Purge Old Cache]:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Strict Network-First untuk Dokumen HTML (Menjamin kode web selalu mutakhir setelah git push)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Jika permintaan navigasi halaman (HTML/index), selalu ambil versi TERBARU dari server
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Hanya jika benar-benar offline tanpa sinyal internet, gunakan cache
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // Untuk asset statis lainnya: Network-First dengan Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// 4. Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
