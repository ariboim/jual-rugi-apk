const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const logoFile = path.join(publicDir, 'assets/aistudio/logo_transparent.png');

if (!fs.existsSync(logoFile)) {
  console.error('Logo file not found at:', logoFile);
  process.exit(1);
}

console.log('Using source logo:', logoFile);

function run(cmd, args) {
  const res = spawnSync(cmd, args);
  if (res.status !== 0) {
    console.error(`Error executing ${cmd}:`, res.stderr?.toString());
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

// 1. Generate 512x512 maskable icon with safe zone
// Safe zone circle is diameter 409.6px (radius 204.8px) from center (256, 256).
// Width 360, height 161: corners are at distance sqrt(180^2 + 80.5^2) = 197px < 204.8px.
console.log('Generating pwa-maskable-512x512.png...');
run('convert', [
  '-size', '512x512', 'xc:white',
  '(', logoFile, '-resize', '360x161', ')',
  '-gravity', 'center', '-composite',
  path.join(publicDir, 'pwa-maskable-512x512.png')
]);

// 2. Generate 512x512 standard icon (purpose: any)
console.log('Generating pwa-512x512.png...');
run('convert', [
  '-size', '512x512', 'xc:white',
  '(', logoFile, '-resize', '390x175', ')',
  '-gravity', 'center', '-composite',
  path.join(publicDir, 'pwa-512x512.png')
]);

// 3. Generate 192x192 icon (purpose: any)
console.log('Generating pwa-192x192.png...');
run('convert', [
  '-size', '192x192', 'xc:white',
  '(', logoFile, '-resize', '144x64', ')',
  '-gravity', 'center', '-composite',
  path.join(publicDir, 'pwa-192x192.png')
]);

// 4. Generate 180x180 apple-touch-icon
console.log('Generating apple-touch-icon.png...');
run('convert', [
  '-size', '180x180', 'xc:white',
  '(', logoFile, '-resize', '135x60', ')',
  '-gravity', 'center', '-composite',
  path.join(publicDir, 'apple-touch-icon.png')
]);

// 5. Generate favicon.png (64x64 and 32x32)
console.log('Generating favicon.png...');
run('convert', [
  '-size', '64x64', 'xc:white',
  '(', logoFile, '-resize', '52x23', ')',
  '-gravity', 'center', '-composite',
  path.join(publicDir, 'favicon.png')
]);

// 6. Generate favicon.ico (multi-resolution 16, 32, 48)
console.log('Generating favicon.ico...');
run('convert', [
  path.join(publicDir, 'favicon.png'),
  '-resize', '32x32',
  path.join(publicDir, 'favicon.ico')
]);

// 7. Generate vector / high-res icon.svg with crisp rendering
console.log('Generating icon.svg...');
const pwa512Base64 = fs.readFileSync(path.join(publicDir, 'pwa-512x512.png')).toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
  </defs>
  <!-- Clean white background matching native app icon style -->
  <rect width="512" height="512" rx="108" fill="#ffffff"/>
  <rect width="512" height="512" rx="108" fill="none" stroke="#f1f5f9" stroke-width="2"/>
  
  <!-- Embedded High-Definition JualRugi.id Brand Logo -->
  <image href="data:image/png;base64,${pwa512Base64}" x="0" y="0" width="512" height="512" />
</svg>
`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

// 8. Generate standalone manifest.json
console.log('Generating manifest.json...');
const manifestJson = {
  id: '/',
  name: 'JualRugi.id - Pasar Butuh Uang (BU) COD',
  short_name: 'JualRugi',
  description: 'Pasar Jual Cepat & Butuh Uang (BU) Diskon Ekstrim - Transaksi Aman COD Tatap Muka dengan Verifikasi Multimodal',
  theme_color: '#ffffff',
  background_color: '#ffffff',
  display: 'standalone',
  orientation: 'portrait-primary',
  start_url: '/',
  scope: '/',
  categories: ['shopping', 'business', 'lifestyle'],
  icons: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/pwa-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ]
};
fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifestJson, null, 2), 'utf8');

console.log('All PWA icon assets generated successfully!');
