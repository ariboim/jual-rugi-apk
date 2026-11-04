// Service Worker Minimal untuk JualRugi.my.id PWA (Standar WebAPK Android & Chrome)
const CACHE_NAME = 'jualrugi-cache-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/aistudio/logo_transparent.png',
  '/assets/aistudio/logo_icon_transparent.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/favicon.ico',
  '/icon.svg'
];

// 1. Install Event: Precache resource penting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Bersihkan cache lama & ambil alih klien langsung
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-first dengan Cache Fallback untuk menjamin data selalu mutakhir
self.addEventListener('fetch', (event) => {
  // Hanya tangani GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Abaikan WebSocket atau browser extensions
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Jika respons valid, simpan salinan ke cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika offline atau jaringan putus, ambil dari cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback ke halaman utama jika navigasi HTML
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
