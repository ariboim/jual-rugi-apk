import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Zap,
  RefreshCw,
  KeyRound,
  Globe,
  Sparkles,
  FileDown,
  Download,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
  isSupabaseConfigured,
} from '../services/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    // Simpan ke local storage
    saveSupabaseCredentials(url, anonKey);

    // Uji koneksi ke Supabase
    const result = await testSupabaseConnection();
    setTesting(false);
    setTestResult(result);

    if (result.success) {
      onConfigSaved();
    }
  };

  const sampleSQL = `-- 1. Buat Tabel listings di Supabase
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
  seller_name TEXT DEFAULT 'Penjual',
  seller_phone TEXT,
  seller_email TEXT,
  is_priority BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Izin Akses Anonim (RLS)
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
USING (true);`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sampleSQL);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto p-5 sm:p-6 text-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-sky-950">
                Database Supabase Online
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isConfigured
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isConfigured ? '🟢 Terhubung' : '🟡 Belum Terhubung'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simpan data iklan permanen & sambungkan ke Zapier / Mayar
            </p>
          </div>
        </div>

        {/* Banner Unduh Panduan PDF (Bisa Dibaca Offline) */}
        <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-sky-950">Panduan Lengkap Setup (PDF)</h4>
              <p className="text-[10.5px] text-slate-500">Simpan ke HP/Laptop agar tidak hilang</p>
            </div>
          </div>
          <a
            href="/PANDUAN_SETUP_DATABASE_SUPABASE_JUALRUGI.pdf"
            download="PANDUAN_SETUP_DATABASE_SUPABASE_JUALRUGI.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition active:scale-95 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PDF</span>
          </a>
        </div>

        {/* Alert Hasil Uji Koneksi */}
        {testResult && (
          <div
            className={`mb-4 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">
              <p className="font-bold">{testResult.success ? 'Berhasil!' : 'Perhatian:'}</p>
              <p className="text-[11px] mt-0.5">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Form Pengisian Kredensial Supabase */}
        <form onSubmit={handleSaveAndTest} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span>Project URL Supabase</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://xyzabcdefghijklm.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs font-mono text-slate-900 outline-none shadow-2xs"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Ditemukan di dashboard Supabase: Project Settings &gt; API &gt; Project URL
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-sky-600" />
              <span>API Anon Key (Public)</span>
            </label>
            <input
              type="text"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs font-mono text-slate-900 outline-none shadow-2xs"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Ditemukan di dashboard Supabase: Project Settings &gt; API &gt; Project API keys (anon public)
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={testing || !url || !anonKey}
              className="grow py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Menguji Koneksi...' : 'Simpan & Uji Koneksi Database'}</span>
            </button>
          </div>
        </form>

        {/* Kode SQL Siap Salin */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-sky-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Kode SQL Pembuat Tabel (Tabel 'listings')</span>
            </label>
            <button
              type="button"
              onClick={handleCopySQL}
              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-sky-200"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedSQL ? 'Tersalin! ✅' : 'Salin Kode SQL'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Copy kode ini dan paste di menu <strong>SQL Editor</strong> di dashboard Supabase Anda, lalu klik tombol <strong>Run</strong>.
          </p>
          <div className="relative">
            <pre className="p-3 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-36 leading-relaxed">
              {sampleSQL}
            </pre>
          </div>
        </div>

        {/* Catatan Zapier & Mayar */}
        <div className="mt-4 p-3 rounded-2xl bg-sky-50/70 border border-sky-100 text-[11px] text-sky-950 flex items-start gap-2">
          <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Siap untuk Zapier & Mayar:</strong> Karena data tersimpan di Supabase, Anda dapat membuat Webhook di Zapier (Trigger: <em>New Row in Supabase 'listings'</em>) untuk otomatis mengirim notifikasi WhatsApp atau mengonfirmasi pembayaran Mayar!
          </p>
        </div>
      </div>
    </div>
  );
};
