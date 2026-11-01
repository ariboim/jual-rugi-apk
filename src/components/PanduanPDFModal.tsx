import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Database,
  Zap,
} from 'lucide-react';

interface PanduanPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSupabaseConfig?: () => void;
}

export const PanduanPDFModal: React.FC<PanduanPDFModalProps> = ({
  isOpen,
  onClose,
  onOpenSupabaseConfig,
}) => {
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const sqlCode = `-- 1. Buat Tabel listings di Supabase
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

-- 2. Aktifkan Keamanan Row Level Security (RLS)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Izinkan publik baca iklan" 
ON public.listings FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Izinkan publik pasang iklan" 
ON public.listings FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Izinkan publik update iklan" 
ON public.listings FOR UPDATE 
TO anon, authenticated 
USING (true);

CREATE POLICY "Izinkan publik hapus iklan" 
ON public.listings FOR DELETE 
TO anon, authenticated 
USING (true);`;

  const fullGuideText = `========================================================
PANDUAN LENGKAP SETUP DATABASE SUPABASE - JUALRUGI.ID
========================================================

LANGKAH 1: DAFTAR AKUN SUPABASE (GRATIS)
1. Buka browser: https://supabase.com
2. Klik tombol "Start your project" atau "Sign in", lalu daftar via GitHub atau Akun Google Anda.
3. Di Dashboard Supabase, klik "New Project".
4. Isi formulir:
   - Name: jualrugi-db
   - Database Password: buat password yang aman
   - Region: Singapore (ap-southeast-1)
   - Pricing Plan: Free Plan ($0/bulan)
5. Klik "Create new project" dan tunggu 1-2 menit hingga database aktif.

LANGKAH 2: JALANKAN KODE SQL
1. Di menu sebelah kiri Supabase, klik ikon "SQL Editor" (>_).
2. Klik "+ New query".
3. Paste kode SQL berikut:

${sqlCode}

4. Klik tombol hijau "Run" (atau Ctrl+Enter).

LANGKAH 3: AMBIL URL & ANON KEY
1. Klik ikon gerigi "Project Settings" di pojok kiri bawah.
2. Klik menu "API".
3. Salin 2 nilai berikut:
   - Project URL (contoh: https://xyzabcdef.supabase.co)
   - Project API keys (anon public) (kunci berawalan eyJhbGciOi...)

LANGKAH 4: HUBUNGKAN KE APLIKASI
1. Buka aplikasi jualrugi.id > Tab "Akun Saya".
2. Klik "Koneksi Supabase".
3. Paste Project URL dan Anon Key, lalu klik "Simpan & Uji Koneksi".
4. Status akan berubah menjadi "🟢 Terhubung"!

LANGKAH 5: INTEGRASI ZAPIER & MAYAR
- Zapier: Trigger "New Row in Table" -> Table "listings" -> Kirim pesan otomatis WhatsApp/Email.
- Mayar: Webhook pembayaran sundul/prioritas otomatis mengupdate kolom "is_priority = true".
========================================================`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(fullGuideText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Menggunakan fetch Blob agar tidak diblokir oleh sandbox iframe browser
      const response = await fetch('/PANDUAN_SETUP_DATABASE_SUPABASE_JUALRUGI.pdf');
      if (!response.ok) throw new Error('File tidak ditemukan');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'PANDUAN_SETUP_DATABASE_SUPABASE_JUALRUGI.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.warn('Fallback download:', err);
      // Fallback direct navigation
      window.location.href = '/PANDUAN_SETUP_DATABASE_SUPABASE_JUALRUGI.pdf';
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto p-5 sm:p-7 text-slate-800 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer z-10"
          title="Tutup Panduan"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <div className="pr-8">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-sky-950">
                Panduan Lengkap Setup Supabase
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Gratis
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Panduan pemula non-programmer untuk menyimpan data iklan permanen & integrasi Zapier/Mayar.
            </p>
          </div>
        </div>

        {/* Action Bar (Download PDF, Copy Text, Cetak) */}
        <div className="flex flex-wrap items-center gap-2 py-3 border-b border-slate-100 bg-sky-50/50 -mx-5 sm:-mx-7 px-5 sm:px-7 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
            <span>{downloading ? 'Mengunduh...' : 'Unduh File PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAll}
            className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedAll ? 'Teks Tersalin! ✅' : 'Salin Seluruh Panduan'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:flex py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Cetak atau Simpan sebagai PDF via Browser"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak / Cetak PDF</span>
          </button>

          {onOpenSupabaseConfig && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSupabaseConfig();
              }}
              className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 ml-auto cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Buka Form Input Supabase</span>
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto space-y-5 py-4 pr-1 text-xs text-slate-700 leading-relaxed print:overflow-visible">
          {/* LANGKAH 1 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-sky-900 font-extrabold text-sm">
              <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs">
                1
              </span>
              <h3>Daftar Akun Gratis di Supabase</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
              <li>
                Kunjungi situs resmi: <strong className="text-sky-700 font-mono">https://supabase.com</strong>
              </li>
              <li>
                Klik tombol hijau <strong>"Start your project"</strong> atau <strong>"Sign In"</strong>, lalu daftar menggunakan akun GitHub atau Email Google Anda.
              </li>
              <li>
                Setelah masuk ke Dashboard Supabase, klik tombol hijau <strong>"New Project"</strong>.
              </li>
              <li>
                Isi formulir pembuatan project:
                <div className="mt-1 ml-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] space-y-1 text-slate-800">
                  <p>• <strong>Name</strong>: jualrugi-db</p>
                  <p>• <strong>Database Password</strong>: buat password yang aman & simpan di catatan</p>
                  <p>• <strong>Region</strong>: Singapore (ap-southeast-1) <em>(paling cepat untuk Indonesia)</em></p>
                  <p>• <strong>Pricing Plan</strong>: Free Plan ($0/bulan)</p>
                </div>
              </li>
              <li>
                Klik <strong>"Create new project"</strong> dan tunggu 1-2 menit hingga status database selesai dibuat.
              </li>
            </ol>
          </div>

          {/* LANGKAH 2 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-900 font-extrabold text-sm">
                <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs">
                  2
                </span>
                <h3>Membuat Tabel Iklan ("listings") dengan SQL</h3>
              </div>
              <button
                type="button"
                onClick={handleCopySQL}
                className="py-1 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] flex items-center gap-1 border border-sky-200 cursor-pointer"
              >
                {copiedSQL ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSQL ? 'Tersalin!' : 'Salin Kode SQL'}</span>
              </button>
            </div>
            <p className="text-slate-600">
              Di menu sebelah kiri Supabase, klik ikon <strong>SQL Editor</strong> (&gt;_), klik <strong>"+ New query"</strong>, tempelkan kode berikut lalu klik tombol hijau <strong>Run</strong>:
            </p>
            <div className="relative">
              <pre className="p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[10.5px] overflow-x-auto leading-relaxed border border-slate-800">
                {sqlCode}
              </pre>
            </div>
          </div>

          {/* LANGKAH 3 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-sky-900 font-extrabold text-sm">
              <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs">
                3
              </span>
              <h3>Mengambil Project URL & Anon Key</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
              <li>
                Di pojok kiri bawah dashboard Supabase, klik ikon gerigi <strong>Project Settings</strong>.
              </li>
              <li>
                Klik menu <strong>API</strong> di navigasi samping kiri.
              </li>
              <li>
                Salin 2 nilai penting berikut:
                <ul className="mt-1 ml-4 space-y-1 text-slate-800">
                  <li>• <strong>Project URL</strong>: Contohnya <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">https://xyzabcdef.supabase.co</code></li>
                  <li>• <strong>Project API keys (anon public)</strong>: Kode kunci panjang berawalan <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">eyJhbGciOi...</code></li>
                </ul>
              </li>
            </ol>
          </div>

          {/* LANGKAH 4 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-sky-900 font-extrabold text-sm">
              <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs">
                4
              </span>
              <h3>Hubungkan ke Aplikasi JualRugi.id</h3>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
              <li>
                Buka tab <strong>Akun Saya</strong> di bilah bawah aplikasi ini.
              </li>
              <li>
                Pada kartu <strong>"Database Online (Supabase & Zapier)"</strong>, klik tombol <strong>"Koneksi Supabase"</strong>.
              </li>
              <li>
                Tempelkan Project URL dan Anon Key yang tadi disalin, lalu klik <strong>"Simpan & Uji Koneksi Database"</strong>.
              </li>
              <li>
                Status akan langsung berubah menjadi <strong className="text-emerald-700">🟢 Terhubung</strong>! Data iklan kini tersimpan permanen di cloud.
              </li>
            </ol>
          </div>

          {/* LANGKAH 5 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-sky-50/70 border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-amber-950 font-extrabold text-sm">
              <Zap className="w-4 h-4 text-amber-600" />
              <h3>Integrasi ke Zapier & Mayar</h3>
            </div>
            <div className="space-y-2 text-slate-700">
              <p>
                <strong>A. Notifikasi Otomatis ke WhatsApp / Gmail via Zapier:</strong><br />
                Di zapier.com, buat Zap baru dengan trigger <em>Supabase: New Row in Table 'listings'</em>. Sambungkan action ke WhatsApp Gateway atau Gmail Anda. Setiap ada user yang pasang iklan BU, Anda langsung menerima notifikasi seketika!
              </p>
              <p>
                <strong>B. Konfirmasi Pembayaran Mayar:</strong><br />
                Webhook dari Mayar dapat langsung diarahkan ke Supabase / Zapier untuk menandai kolom <code className="bg-white px-1 py-0.5 rounded border border-amber-200">is_priority = true</code> saat user membayar paket Sundul atau Prioritas BU.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dokumen panduan resmi sistem JualRugi.id</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
