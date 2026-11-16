self.options = {
    "domain": "3nbf4.com",
    "zoneId": 12274867
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')

// Service Worker JualRugi.my.id (Resilient Network-First with Offline Fallback v16)
const CACHE_NAME = 'jualrugi-v16-pwa';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/logo_icon.png',
  '/logo_transparent.png',
  '/og-image.jpg',
  '/og-image.png',
  '/banner-hp-jualrugi.png',
  '/image_3.png'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 1. Install Event: Pre-cache app shell & skip waiting
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

// 2. Activate Event: Bersihkan cache versi lama & claim clients
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

// 3. Fetch Event: Network-First yang tangguh untuk navigasi (Mencegah ERR_FAILED di Android Webview/APK)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Jangan tangani API internal (/api/*) atau backend proxy
  if (url.pathname.startsWith('/api/')) return;

  // A. Navigasi Halaman Utama, PWA start_url (?source=pwa), dan dokumen HTML
  const isNavigation =
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname.endsWith('.html') ||
    url.search.includes('source=');

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
              cache.put('/', networkResponse.clone());
              cache.put('/index.html', networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Fallback saat offline atau cold-start WebView Android
          const cache = await caches.open(CACHE_NAME);
          const cached =
            (await cache.match(event.request, { ignoreSearch: true })) ||
            (await cache.match('/')) ||
            (await cache.match('/index.html'));

          if (cached) {
            return cached;
          }

          // Emergency response agar TIDAK PERNAH terjadi ERR_FAILED di Chromium/Android
          return new Response(
            `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>JualRugi.my.id</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px 16px;text-align:center;background:#f0f9ff;color:#0f172a;}button{background:#0284c7;color:#fff;border:none;padding:12px 28px;border-radius:12px;font-weight:bold;cursor:pointer;margin-top:20px;font-size:14px;}</style></head><body><h2 style="color:#0369a1;">Memuat JualRugi.my.id...</h2><p style="color:#64748b;font-size:14px;">Menghubungkan ke server. Harap pastikan koneksi internet Anda aktif.</p><button onclick="window.location.reload()">Coba Muat Ulang</button><script>setTimeout(function(){window.location.reload();},1500);</script></body></html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        })
    );
    return;
  }

  // B. Aset Statis (CSS, JS, Gambar, Font)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache seketika, fetch background untuk update (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.destination === 'image') {
            return caches.match('/pwa-192x192.png');
          }
        });
    })
  );
});

// 4. Native Web Push Event (Muncul meski aplikasi/browser tertutup total, tanpa pihak ketiga)
self.addEventListener('push', (event) => {
  let payload = {};
  let rawText = '';

  if (event.data) {
    try {
      payload = event.data.json() || {};
    } catch (_) {
      try {
        rawText = event.data.text() || '';
        payload = JSON.parse(rawText);
      } catch (__) {
        payload = rawText ? { body: rawText } : {};
      }
    }
  }

  // Biarkan payload khusus Monetag ditangani oleh script Monetag tanpa tumpang tindih
  const isMonetagInternal =
    payload &&
    payload.source !== 'jualrugi-webpush' &&
    Boolean(payload.zoneId || payload.ymid || payload.on_click || payload.url_params);

  if (isMonetagInternal) {
    return;
  }

  const title = payload.title || '🔥 BU Prioritas Baru — JualRugi.my.id';
  const targetUrl =
    payload.url ||
    (payload.listingId ? `/?id=${encodeURIComponent(payload.listingId)}` : '/');

  const options = {
    body:
      payload.body ||
      'Ada iklan Prioritas Butuh Uang (BU) baru yang disetujui Admin. Cek sekarang!',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/favicon.png',
    tag: payload.tag || `jualrugi-priority-${payload.listingId || Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: targetUrl,
      listingId: payload.listingId || null,
      source: 'jualrugi-webpush',
      timestamp: payload.timestamp || Date.now(),
    },
  };

  if (payload.image && typeof payload.image === 'string') {
    options.image = payload.image;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// 5. Notification Click Event (Membuka iklan langsung meski aplikasi sebelumnya tertutup)
self.addEventListener('notificationclick', (event) => {
  const notifData = (event.notification && event.notification.data) || {};
  const tag = (event.notification && event.notification.tag) || '';
  const isJualRugiNotif =
    notifData.source === 'jualrugi-webpush' ||
    Boolean(notifData.url) ||
    Boolean(notifData.listingId) ||
    tag.startsWith('jualrugi-') ||
    tag.startsWith('ad-approved-');

  if (!isJualRugiNotif && (notifData.on_click || notifData.zoneId || notifData.ymid)) {
    return;
  }

  event.notification.close();

  const rawTarget =
    notifData.url ||
    (notifData.listingId ? `/?id=${encodeURIComponent(notifData.listingId)}` : '/');
  const resolvedUrl = new URL(rawTarget, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        try {
          if (client.url && client.url.startsWith(self.location.origin)) {
            if ('navigate' in client && client.url !== resolvedUrl) {
              await client.navigate(resolvedUrl);
            }
            if ('focus' in client) {
              return client.focus();
            }
          }
        } catch (_) {}
      }
      if (clients.openWindow) {
        return clients.openWindow(resolvedUrl);
      }
    })
  );
});

