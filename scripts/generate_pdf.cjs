const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '../public/PANDUAN_SETUP_DATABASE_SUPABASE_JUALRUGI.pdf');

// Buat direktori public jika belum ada
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Palet Warna Profesional JualRugi.id
const PRIMARY_BLUE = '#0284c7'; // Sky-600
const DARK_NAVY = '#0f172a';    // Slate-900
const TEXT_MUTED = '#475569';   // Slate-600
const BG_CODE = '#1e293b';      // Slate-800
const CODE_GREEN = '#34d399';   // Emerald-400
const BORDER_COLOR = '#cbd5e1'; // Slate-300

// HEADER BANNER
doc
  .rect(45, 40, 505, 65)
  .fill(PRIMARY_BLUE);

doc
  .fillColor('#ffffff')
  .fontSize(16)
  .font('Helvetica-Bold')
  .text('JUALRUGI.ID - PANDUAN SETUP SUPABASE', 60, 52);

doc
  .fontSize(10)
  .font('Helvetica')
  .text('Panduan Pemula: Database Online Gratis & Integrasi Zapier / Mayar', 60, 75);

doc.moveDown(3);

// PENDAHULUAN
doc
  .fillColor(DARK_NAVY)
  .fontSize(12)
  .font('Helvetica-Bold')
  .text('RINGKASAN INTEGRASI', 45, 125);

doc
  .fontSize(9.5)
  .font('Helvetica')
  .fillColor(TEXT_MUTED)
  .text(
    'Panduan ini dibuat khusus bagi Anda yang tidak memiliki latar belakang koding (non-programmer) untuk mengaktifkan database online gratis di Supabase, agar data iklan yang dipasang di jualrugi.id tersimpan permanen di cloud dan bisa dihubungkan ke Zapier / Mayar.',
    { align: 'justify', lineGap: 3 }
  );

doc.moveDown(1);

// LANGKAH 1
doc
  .fillColor(PRIMARY_BLUE)
  .fontSize(11)
  .font('Helvetica-Bold')
  .text('LANGKAH 1: PENDAFTARAN AKUN SUPABASE (GRATIS)');

doc
  .fontSize(9)
  .font('Helvetica')
  .fillColor(DARK_NAVY)
  .text('1. Buka browser dan kunjungi: https://supabase.com', { lineGap: 2 })
  .text('2. Klik tombol "Start your project" atau "Sign in", lalu pilih "Continue with GitHub" atau gunakan Email Google Anda.', { lineGap: 2 })
  .text('3. Setelah masuk ke Dashboard Supabase, klik tombol hijau "New Project".', { lineGap: 2 })
  .text('4. Isi formulir pembuatan project:', { lineGap: 2 })
  .text('    - Name: jualrugi-db', { indent: 15, lineGap: 1 })
  .text('    - Database Password: Buat password aman (simpan di catatan Anda)', { indent: 15, lineGap: 1 })
  .text('    - Region: Singapore (ap-southeast-1) -> Paling cepat untuk akses Indonesia', { indent: 15, lineGap: 1 })
  .text('    - Pricing Plan: Free Plan ($0/bulan)', { indent: 15, lineGap: 2 })
  .text('5. Klik "Create new project" dan tunggu 1-2 menit hingga status database siap digunakan.', { lineGap: 2 });

doc.moveDown(1);

// LANGKAH 2
doc
  .fillColor(PRIMARY_BLUE)
  .fontSize(11)
  .font('Helvetica-Bold')
  .text('LANGKAH 2: MEMBUAT TABEL IKLAN ("listings") DENGAN SQL');

doc
  .fontSize(9)
  .font('Helvetica')
  .fillColor(DARK_NAVY)
  .text('1. Di menu navigasi samping kiri Supabase, klik menu "SQL Editor" (ikon >_).', { lineGap: 2 })
  .text('2. Klik tombol "+ New query".', { lineGap: 2 })
  .text('3. Salin (copy) dan tempel (paste) kode SQL berikut secara utuh ke dalam editor:', { lineGap: 4 });

// KOTAK KODE SQL
const sqlCode = `-- 1. Buat Tabel listings
CREATE TABLE IF NOT EXISTS public.listings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price BIGINT NOT NULL,
  normal_price BIGINT,
  description TEXT,
  category TEXT DEFAULT 'Smartphone & Gadget',
  location TEXT DEFAULT 'Jakarta Selatan',
  condition TEXT DEFAULT 'Bekas Terawat',
  urgent_reason TEXT DEFAULT 'Butuh Uang Hari Ini',
  image_url TEXT,
  seller_name TEXT DEFAULT 'Penjual Terverifikasi',
  seller_phone TEXT,
  seller_email TEXT,
  is_priority BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS) & Hak Akses Publik
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Izinkan publik baca iklan" ON public.listings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Izinkan publik pasang iklan" ON public.listings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Izinkan publik update iklan" ON public.listings FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Izinkan publik hapus iklan" ON public.listings FOR DELETE TO anon, authenticated USING (true);`;

const sqlBoxTop = doc.y;
doc
  .rect(45, sqlBoxTop, 505, 175)
  .fill(BG_CODE);

doc
  .fillColor(CODE_GREEN)
  .fontSize(7.5)
  .font('Courier')
  .text(sqlCode, 55, sqlBoxTop + 10, { width: 485, lineGap: 2 });

doc.y = sqlBoxTop + 185;

doc
  .fontSize(9)
  .font('Helvetica-Bold')
  .fillColor(DARK_NAVY)
  .text('4. Klik tombol hijau "Run" (atau tekan Ctrl + Enter). Jika muncul pesan "Success", tabel siap!', { lineGap: 4 });

// HALAMAN 2
doc.addPage();

// HEADER HALAMAN 2
doc
  .rect(45, 40, 505, 45)
  .fill(PRIMARY_BLUE);

doc
  .fillColor('#ffffff')
  .fontSize(13)
  .font('Helvetica-Bold')
  .text('JUALRUGI.ID - KONEKSI APLIKASI & ZAPIER / MAYAR', 60, 54);

doc.y = 105;

// LANGKAH 3
doc
  .fillColor(PRIMARY_BLUE)
  .fontSize(11)
  .font('Helvetica-Bold')
  .text('LANGKAH 3: MENGAMBIL URL & ANON KEY SUPABASE');

doc
  .fontSize(9)
  .font('Helvetica')
  .fillColor(DARK_NAVY)
  .text('1. Di pojok kiri bawah dashboard Supabase, klik ikon gerigi "Project Settings" (Settings).', { lineGap: 2 })
  .text('2. Pilih menu "API" di submenu sebelah kiri.', { lineGap: 2 })
  .text('3. Salin 2 nilai berikut:', { lineGap: 2 })
  .text('    - Project URL: Contohnya https://abcdefghijklm.supabase.co', { indent: 15, lineGap: 1 })
  .text('    - Project API keys (anon public): Kunci panjang diawali eyJhbGciOi...', { indent: 15, lineGap: 3 });

doc.moveDown(1);

// LANGKAH 4
doc
  .fillColor(PRIMARY_BLUE)
  .fontSize(11)
  .font('Helvetica-Bold')
  .text('LANGKAH 4: MENGHUBUNGKAN KE APLIKASI JUALRUGI.ID');

doc
  .fontSize(9)
  .font('Helvetica')
  .fillColor(DARK_NAVY)
  .text('1. Buka aplikasi web jualrugi.id.', { lineGap: 2 })
  .text('2. Klik tab "Akun Saya" di bilah navigasi bawah.', { lineGap: 2 })
  .text('3. Pada kartu "Database Online (Supabase & Zapier)", klik tombol "Koneksi Supabase".', { lineGap: 2 })
  .text('4. Tempelkan (paste) Project URL dan Anon Key yang tadi Anda salin.', { lineGap: 2 })
  .text('5. Klik tombol "Simpan & Uji Koneksi Database".', { lineGap: 2 })
  .text('6. Status akan langsung berubah menjadi "🟢 Terhubung"! Semua data iklan kini langsung tersimpan di cloud.', { lineGap: 3 });

doc.moveDown(1);

// LANGKAH 5
doc
  .fillColor(PRIMARY_BLUE)
  .fontSize(11)
  .font('Helvetica-Bold')
  .text('LANGKAH 5: INTEGRASI KE ZAPIER & MAYAR');

doc
  .fontSize(9)
  .font('Helvetica')
  .fillColor(DARK_NAVY)
  .text('A. CARA MENGHUBUNGKAN KE ZAPIER:', { font: 'Helvetica-Bold', lineGap: 2 })
  .text('1. Buat Zap baru di https://zapier.com', { lineGap: 1 })
  .text('2. Pilih Trigger App: "Supabase", pilih Event: "New Row in Table".', { lineGap: 1 })
  .text('3. Pilih tabel: "listings".', { lineGap: 1 })
  .text('4. Pilih Action: WhatsApp Gateway (cth: Fonnte/Wablas/Twilio) atau Kirim Email ke Gmail Anda.', { lineGap: 1 })
  .text('Hasil: Setiap kali ada orang yang memasang iklan Butuh Uang di web, Anda akan otomatis menerima notifikasi WhatsApp / Email seketika!', { font: 'Helvetica-Oblique', lineGap: 4 })
  .moveDown(0.5)
  .text('B. CARA MENGHUBUNGKAN KE MAYAR:', { font: 'Helvetica-Bold', lineGap: 2 })
  .text('1. Di dashboard Mayar (https://mayar.id), buat produk pembayaran "Sundul Iklan Rp 25.000" dan "Highlight BU Rp 75.000".', { lineGap: 1 })
  .text('2. Di menu Webhook Mayar, pasang URL Webhook yang mengarah ke Supabase atau Zapier.', { lineGap: 1 })
  .text('3. Saat pembayaran sukses, sistem otomatis menandai kolom is_priority = true di tabel listings!', { lineGap: 3 });

doc.moveDown(1);

// KOTAK TIPS KEAMANAN
doc
  .rect(45, doc.y, 505, 55)
  .fill('#f0fdf4');

doc
  .fillColor('#166534')
  .fontSize(9)
  .font('Helvetica-Bold')
  .text('TIPS PENTING & KEAMANAN:', 55, doc.y - 45);

doc
  .fontSize(8.5)
  .font('Helvetica')
  .fillColor('#15803d')
  .text('• Anon Key Supabase adalah public key yang aman digunakan di browser karena dilindungi RLS.', 55, doc.y - 32)
  .text('• Jangan pernah membagikan Service Role Key (secret key) kepada siapapun.', 55, doc.y - 20)
  .text('• Simpan file PDF ini di perangkat HP atau Laptop Anda untuk panduan sewaktu-waktu.', 55, doc.y - 8);

// FOOTER
doc
  .fontSize(8)
  .fillColor(TEXT_MUTED)
  .font('Helvetica')
  .text(
    'Dokumen ini di-generate otomatis oleh Sistem JualRugi.id - Pasar Butuh Uang (BU) Terverifikasi',
    45,
    780,
    { align: 'center', width: 505 }
  );

doc.end();

writeStream.on('finish', () => {
  console.log('✅ File PDF Berhasil Dibuat di:', outputPath);
});
