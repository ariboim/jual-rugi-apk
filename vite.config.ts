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
        if (fs.existsSync(swPath)) {
          const current = fs.readFileSync(swPath, 'utf8');
          if (!current.includes('12274867')) {
            fs.writeFileSync(swPath, `${MONETAG_SW_HEADER}\n${current}`, 'utf8');
          }
        } else {
          fs.writeFileSync(swPath, MONETAG_SW_HEADER, 'utf8');
        }
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
