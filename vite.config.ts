import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig, type Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const MONETAG_SW_HEADER = `self.options = {
    "domain": "3nbf4.com",
    "zoneId": 12274867
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')
`;

const NATIVE_WEB_PUSH_SW_BLOCK = `
// Native Web Push (VAPID) JualRugi.my.id — Tanpa Pihak Ketiga
self.addEventListener('push', function (event) {
  var payload = {};
  var rawText = '';
  if (event.data) {
    try {
      payload = event.data.json() || {};
    } catch (e) {
      try {
        rawText = event.data.text() || '';
        payload = JSON.parse(rawText);
      } catch (e2) {
        payload = rawText ? { body: rawText } : {};
      }
    }
  }
  var isMonetagInternal =
    payload &&
    payload.source !== 'jualrugi-webpush' &&
    Boolean(payload.zoneId || payload.ymid || payload.on_click || payload.url_params);
  if (isMonetagInternal) return;

  var title = payload.title || '🔥 BU Prioritas Baru — JualRugi.my.id';
  var targetUrl =
    payload.url ||
    (payload.listingId ? '/?id=' + encodeURIComponent(payload.listingId) : '/');

  var options = {
    body:
      payload.body ||
      'Ada iklan Prioritas Butuh Uang (BU) baru yang disetujui Admin. Cek sekarang!',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/favicon.png',
    tag: payload.tag || 'jualrugi-priority-' + (payload.listingId || Date.now()),
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

self.addEventListener('notificationclick', function (event) {
  var notifData = (event.notification && event.notification.data) || {};
  var tag = (event.notification && event.notification.tag) || '';
  var isJualRugiNotif =
    notifData.source === 'jualrugi-webpush' ||
    Boolean(notifData.url) ||
    Boolean(notifData.listingId) ||
    tag.indexOf('jualrugi-') === 0 ||
    tag.indexOf('ad-approved-') === 0;
  if (!isJualRugiNotif && (notifData.on_click || notifData.zoneId || notifData.ymid)) return;

  event.notification.close();
  var rawTarget =
    notifData.url ||
    (notifData.listingId ? '/?id=' + encodeURIComponent(notifData.listingId) : '/');
  var resolvedUrl = new URL(rawTarget, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        try {
          if (client.url && client.url.indexOf(self.location.origin) === 0) {
            if ('navigate' in client && client.url !== resolvedUrl) {
              await client.navigate(resolvedUrl);
            }
            if ('focus' in client) {
              return client.focus();
            }
          }
        } catch (err) {}
      }
      if (clients.openWindow) {
        return clients.openWindow(resolvedUrl);
      }
    })
  );
});
`;

function monetagServiceWorkerPlugin(): Plugin {
  let outDir = 'dist';
  return {
    name: 'monetag-service-worker-header',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = config.build.outDir || 'dist';
    },
    closeBundle: {
      order: 'post',
      sequential: true,
      async handler() {
        const swPath = path.resolve(outDir, 'sw.js');
        let next = fs.existsSync(swPath) ? fs.readFileSync(swPath, 'utf8') : '';
        if (!next.includes('12274867')) {
          next = `${MONETAG_SW_HEADER}\n${next}`;
        }
        if (!next.includes('jualrugi-webpush')) {
          next = `${next}\n${NATIVE_WEB_PUSH_SW_BLOCK}`;
        }
        fs.writeFileSync(swPath, next, 'utf8');
      },
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.json',
        includeAssets: [
          'favicon.ico',
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'logo_icon.png',
          'logo_transparent.png',
          'og-image.jpg',
          'og-image.png',
          'banner-hp-jualrugi.png',
          'image_3.png',
        ],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          globIgnores: ['**/assets/aistudio/**'],
          navigateFallbackDenylist: [/^\/api\//, /^\/sitemap\.xml$/, /^\/robots\.txt$/, /^\/sw\.js$/],
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        manifest: {
          id: '/',
          name: 'JualRugi.my.id - Pasar Butuh Uang (BU)',
          short_name: 'JualRugi',
          description: 'Pasar Jual Cepat & Butuh Uang (BU) Diskon Ekstrim - Transaksi Aman COD Tatap Muka Terpercaya',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      monetagServiceWorkerPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(fileURLToPath(new URL('.', import.meta.url))),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
