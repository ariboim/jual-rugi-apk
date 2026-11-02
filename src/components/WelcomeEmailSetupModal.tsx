import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Send,
  Eye,
  Check,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import {
  getZapierWebhookUrl,
  saveZapierWebhookUrl,
  sendWelcomeEmailAutomation,
} from '../services/welcomeEmail';

interface WelcomeEmailSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSuccessToast?: (msg: string) => void;
}

export const WelcomeEmailSetupModal: React.FC<WelcomeEmailSetupModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = 'bca.ccpl@gmail.com',
  onSuccessToast,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testEmail, setTestEmail] = useState(defaultEmail);
  const [testName, setTestName] = useState('Pengguna Baru JualRugi');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    webhookDispatched?: boolean;
    zapierResponse?: string;
    preview?: { subject: string; html: string };
  } | null>(null);
  const [showInAppLetter, setShowInAppLetter] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnosa' | 'surat' | 'zapier'>('diagnosa');

  useEffect(() => {
    if (isOpen) {
      setWebhookUrl(getZapierWebhookUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    saveZapierWebhookUrl(webhookUrl);
    if (onSuccessToast) {
      onSuccessToast('✅ Webhook URL Zapier berhasil disimpan di sistem!');
    }
  };

  const handleTestSend = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Mohon masukkan alamat email tujuan yang valid.');
      return;
    }

    setIsSending(true);
    setTestResult(null);

    // Simpan webhook jika diisi
    if (webhookUrl) {
      saveZapierWebhookUrl(webhookUrl);
    }

    try {
      const result = await sendWelcomeEmailAutomation({
        name: testName,
        email: testEmail,
        phone: '0812-8888-9999',
      });

      setTestResult(result);
      if (onSuccessToast) {
        onSuccessToast(`🎉 Sinyal webhook berhasil ditembakkan ke Zapier!`);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal memicu welcome email.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto p-5 sm:p-7 text-slate-800 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer z-10"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Mail className="w-6 h-6" />
          </div>
          <div className="pr-8">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Pusat Solusi Welcome Email
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Langsung Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Diagnosa pengiriman Zapier ke Gmail ({defaultEmail}) & surat selamat datang resmi.
            </p>
          </div>
        </div>

        {/* Tab Navigasi */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl mt-4 mb-2 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('diagnosa')}
            className={`py-2 px-1 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'diagnosa'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔍 Diagnosa & Tes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zapier')}
            className={`py-2 px-1 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'zapier'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚙️ 2 Langkah Zapier
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('surat')}
            className={`py-2 px-1 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'surat'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✉️ Surat Selamat Datang
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 py-3 pr-1 text-xs text-slate-700 leading-relaxed">
          {/* TAB 1: DIAGNOSA & TES PENGIRIMAN */}
          {activeTab === 'diagnosa' && (
            <div className="space-y-4">
              {/* Alert Penjelasan Kenapa Email Belum Masuk */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2">
                <h4 className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Mengapa URL Webhook Sudah Dimasukkan Tapi Email Belum Masuk?</span>
                </h4>
                <p className="text-[11.5px] text-amber-900 leading-relaxed">
                  URL Webhook Zapier berfungsi sebagai <strong>penampung data masuk</strong>. Agar email benar-benar terkirim ke Gmail Anda, <strong>2 syarat wajib di bawah ini harus terpenuhi di akun Zapier Anda:</strong>
                </p>
                <div className="space-y-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-[11px] text-amber-950">
                    <strong className="text-amber-900">1. WAJIB Tambahkan Action Step 2 di Zapier:</strong><br />
                    Webhook tidak bisa kirim email sendiri. Di Zapier, Anda harus klik tanda <strong>(+)</strong> di bawah Catch Hook, lalu pilih <strong>Gmail</strong> &gt; Event: <strong>"Send Email"</strong>.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-[11px] text-amber-950">
                    <strong className="text-amber-900">2. WAJIB Klik Tombol "Publish Zap" (Status ON):</strong><br />
                    Jika Zap Anda masih berstatus <strong>DRAFT / OFF</strong> di Zapier, Zapier akan menolak mengirimkan email apapun! Pastikan tombol toggle di pojok kanan atas Zapier sudah berwarna <strong>ON (Hijau)</strong>.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-[11px] text-amber-950">
                    <strong className="text-amber-900">3. Cek Folder "Spam" &amp; Tab "Promosi" di Gmail:</strong><br />
                    Email otomatis pertama kali sering diarahkan oleh sistem proteksi Google ke folder Spam atau tab Promosi.
                  </div>
                </div>
              </div>

              {/* Form Input Webhook & Tombol Tes */}
              <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-sky-950 text-xs flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>URL Webhook Zapier (Catch Hook) Anda:</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Tersimpan di browser &amp; server</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="grow px-3 py-2 rounded-xl bg-white border border-sky-300 text-xs font-mono text-slate-900 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveWebhook}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>

                {/* Form Tes Kirim */}
                <div className="pt-2 border-t border-sky-200/60 space-y-2">
                  <p className="text-[11px] text-slate-600 font-bold">
                    Tes Pengiriman Langsung ke Email Anda:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Email tujuan (cth: bca.ccpl@gmail.com)"
                      className="grow px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs font-mono text-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleTestSend}
                      disabled={isSending}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                      <span>{isSending ? 'Memicu Webhook...' : 'Kirim Tes ke Zapier Sekarang'}</span>
                    </button>
                  </div>
                </div>

                {/* Hasil Uji Coba Real-Time */}
                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-[11px] space-y-1 animate-in fade-in ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>Hasil Tembakan Webhook:</span>
                    </div>
                    <p className="leading-relaxed">{testResult.message}</p>
                    {testResult.zapierResponse && (
                      <div className="mt-1 p-2 rounded-lg bg-white/90 border border-emerald-200 font-mono text-[10px] text-slate-800">
                        <strong>Respons Server Zapier:</strong> {testResult.zapierResponse}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PANDUAN STEP-BY-STEP ZAPIER GMAIL */}
          {activeTab === 'zapier' && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Cara Mengatur Gmail di Zapier (Pasti Mengirim Email):</span>
              </h4>

              <div className="space-y-3 text-[11.5px] text-slate-700">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-sky-900">Step 1: Pastikan Trigger Catch Hook Siap</div>
                  <p>Buka Zap Anda di Zapier &gt; Trigger: <strong>Webhooks by Zapier</strong> &gt; Event: <strong>Catch Hook</strong>. Klik tombol <strong>"Test trigger"</strong>. Data nama dan email dari pendaftaran akan langsung terbaca.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-sky-900">Step 2: Tambahkan Action Gmail (Kirim Email)</div>
                  <p>Di bawah trigger Webhook, klik tombol tanda plus <strong>(+)</strong>:</p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
                    <li>Pilih App: <strong>Gmail</strong> &gt; Event: <strong>Send Email</strong>.</li>
                    <li>Hubungkan akun Google Gmail Anda.</li>
                    <li>Pada kolom <strong>To</strong>: Klik dan pilih field <code className="bg-white px-1 py-0.5 rounded border border-slate-300 text-sky-700">1. Email</code>.</li>
                    <li>Pada kolom <strong>Subject</strong>: Pilih <code className="bg-white px-1 py-0.5 rounded border border-slate-300 text-sky-700">1. Subject</code>.</li>
                    <li>Pada kolom <strong>Body Type</strong>: Pilih <strong>html</strong>.</li>
                    <li>Pada kolom <strong>Body</strong>: Pilih <code className="bg-white px-1 py-0.5 rounded border border-slate-300 text-sky-700">1. Html Content</code>.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-emerald-950">
                  <div className="font-black text-emerald-900">Step 3: WAJIB Klik "Publish" (Status ON)</div>
                  <p>Klik tombol biru besar <strong>"Publish"</strong> di pojok kanan atas editor Zapier. Pastikan tombol saklar toggle Zap Anda sudah berwarna <strong>ON (Hijau)</strong>. Jika masih bertuliskan "Draft", email tidak akan pernah keluar.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SURAT SELAMAT DATANG LANGSUNG DI APLIKASI (100% TIDAK PERNAH HILANG) */}
          {activeTab === 'surat' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span className="font-bold text-sky-950">Surat Sambutan &amp; Panduan Resmi</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Bonus Kuota Aktif
                </span>
              </div>

              {/* Tampilan Surat di Layar */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="text-center pb-3 border-b border-slate-100">
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-800 font-black text-[10px] uppercase tracking-wider">
                    Member Baru Terverifikasi
                  </span>
                  <h3 className="text-base font-black text-slate-950 mt-2">
                    Selamat Datang di JualRugi.id! 👋
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pasar Butuh Uang (BU) Diskon Ekstrim &amp; Transaksi COD Terpercaya
                  </p>
                </div>

                <p className="text-xs text-slate-700">
                  Halo <strong>{testName}</strong> ({testEmail}),
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Selamat bergabung di komunitas jual beli Butuh Uang (BU) terbesar di Indonesia! Akun Anda telah resmi aktif dan siap digunakan untuk mencari gadget, laptop, atau kendaraan impian dengan harga sadis.
                </p>

                <div className="p-3.5 rounded-2xl bg-amber-50 border-l-4 border-amber-400 text-amber-950 space-y-1.5">
                  <div className="font-black text-xs flex items-center gap-1.5">
                    <span>🛡️ 3 Aturan Emas Transaksi COD Aman:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900 pl-1">
                    <li>Wajib <strong>COD tatap muka</strong> di tempat umum yang ramai (Mall, Minimarket, Stasiun).</li>
                    <li><strong>Jangan pernah mentransfer DP / uang muka</strong> dalam bentuk apapun sebelum memegang dan menguji langsung barang.</li>
                    <li>Periksa segel, fungsi tombol, layar, baterai, dan IMEI bersama penjual.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <div>
                      <p className="font-black text-xs">Bonus Pendaftaran: 1 Slot Iklan Gratis</p>
                      <p className="text-[10px] text-emerald-700">Sudah otomatis ditambahkan ke kuota akun Anda</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Inbox className="w-3.5 h-3.5 text-sky-600" />
            <span>Target Email: <strong>{testEmail}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
