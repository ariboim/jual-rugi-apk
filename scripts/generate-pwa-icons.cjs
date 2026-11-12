const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const assetsDir = path.join(publicDir, 'assets/aistudio');
const sourceJpg = path.join(assetsDir, '1793725946048_8b2c018e.jpg');
const fullLogoFile = path.join(assetsDir, 'logo_transparent.png');
const iconFile = path.join(assetsDir, 'logo_icon_transparent.png');

if (!fs.existsSync(sourceJpg)) {
  console.error('Source JPG file not found at:', sourceJpg);
  process.exit(1);
}

console.log('Using source image:', sourceJpg);

function run(cmd, args) {
  const res = spawnSync(cmd, args);
  if (res.status !== 0) {
    console.error(`Error executing ${cmd}:`, res.stderr?.toString());
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

// 1. Generate full transparent logo (no frame, transparent background)
console.log('Generating logo_transparent.png...');
run('convert', [
  sourceJpg,
  '-fuzz', '18%',
  '-transparent', '#f7f7f5',
  '-fuzz', '12%',
  '-transparent', 'white',
  '-trim',
  '+repage',
  fullLogoFile
]);

// 2. Extract and generate clean transparent symbol icon (yellow basket + red downward arrow)
console.log('Generating logo_icon_transparent.png...');
run('convert', [
  fullLogoFile,
  '-crop', '940x1054+0+0',
  '-trim',
  '+repage',
  iconFile
]);

// 3. Generate 512x512 maskable icon with safe zone
// Safe zone circle is diameter 409.6px (radius 204.8px) from center (256, 256).
console.log('Generating pwa-maskable-512x512.png...');
run('convert', [
  '-size', '512x512', 'xc:white',
  '(', iconFile, '-resize', '360x360', ')',
  '-gravity', 'center', '-composite',
  path.join(publicDir, 'pwa-maskable-512x512.png')
]);

// 4. Generate 512x512 standard icon (purpose: any)
console.log('Generating pwa-512x512.png...');
run('convert', [
  '-size', '512x512', 'xc:white',
  '(', iconFile, '-resize', '390x390', ')',
  '-gravity', 'center', '-composite',
  path.join(publicDir, 'pwa-512x512.png')
]);

// 5. Generate 192x192 icon (purpose: any)
console.log('Generating pwa-192x192.png...');
run('convert', [
  '-size', '192x192', 'xc:white',
  '(', iconFile, '-resize', '148x148', ')',
  '-gravity', 'center', '-composite',
  path.join(publicDir, 'pwa-192x192.png')
]);

// 6. Generate 180x180 apple-touch-icon
console.log('Generating apple-touch-icon.png...');
run('convert', [
  '-size', '180x180', 'xc:white',
  '(', iconFile, '-resize', '135x135', ')',
  '-gravity', 'center', '-composite',
  path.join(publicDir, 'apple-touch-icon.png')
]);

// 7. Generate favicon.png (64x64)
console.log('Generating favicon.png...');
run('convert', [
  '-size', '64x64', 'xc:none',
  '(', iconFile, '-resize', '56x56', ')',
  '-gravity', 'center', '-composite',
  path.join(publicDir, 'favicon.png')
]);

// 8. Generate favicon.ico (multi-resolution 32x32)
console.log('Generating favicon.ico...');
run('convert', [
  path.join(publicDir, 'favicon.png'),
  '-resize', '32x32',
  path.join(publicDir, 'favicon.ico')
]);

// 9. Generate vector / high-res icon.svg with crisp rendering
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
  
  <!-- Embedded High-Definition JualRugi.my.id Brand Logo Symbol -->
  <image href="data:image/png;base64,${pwa512Base64}" x="0" y="0" width="512" height="512" />
</svg>
`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

// 10. Generate standalone manifest.json
console.log('Generating manifest.json...');
const manifestJson = {
  id: '/',
  name: 'JualRugi.my.id - Pasar Butuh Uang (BU) COD',
  short_name: 'JualRugi.my.id',
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
console.log('Generating og-image.png (1200x630 with solid white background for WhatsApp Dark Mode)...');
run('convert', [
  '-size', '1200x630', 'xc:white',
  '(', fullLogoFile, '-resize', '960x420', ')',
  '-gravity', 'center', '-composite',
  '-quality', '95',
  path.join(publicDir, 'og-image.png')
]);
fs.copyFileSync(path.join(publicDir, 'og-image.png'), path.join(assetsDir, 'og-image.png'));

// Also flatten fullLogoFile so that cached URLs to logo_transparent.png have a solid white background
run('convert', [
  fullLogoFile,
  '-background', 'white',
  '-flatten',
  '-alpha', 'off',
  fullLogoFile
]);
fs.copyFileSync(fullLogoFile, path.join(publicDir, 'logo_transparent.png'));
fs.copyFileSync(fullLogoFile, path.join(publicDir, 'logo.png'));

console.log('All PWA & OpenGraph assets generated successfully!');
