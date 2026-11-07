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
  KeyRound,
  Layers,
  HeartHandshake,
  Link,
} from 'lucide-react';
import {
  getFreeWebhookUrl,
  saveFreeWebhookUrl,
  getBrevoConfig,
  saveBrevoConfig,
  sendWelcomeEmailAutomation,
  BrevoConfig,
  DEFAULT_BREVO_SENDER_EMAIL,
  DEFAULT_BREVO_SENDER_NAME,
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
  // Pilihan Tab Metode (Brevo aktif sebagai integrasi utama dengan branded domain)
  const [activeTab, setActiveTab] = useState<'brevo' | 'make' | 'surat'>('brevo');

  // State Brevo API
  const [brevoConfig, setBrevoConfig] = useState<BrevoConfig>(() => getBrevoConfig());

  // State Make.com / Webhook Gratis
  const [webhookUrl, setWebhookUrl] = useState(() => getFreeWebhookUrl());

  // State Testing
  const [testEmail, setTestEmail] = useState(defaultEmail);
  const [testName, setTestName] = useState('Pengguna Baru JualRugi');
  const [isSending, setIsSending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    provider?: string;
  } | null>(null);

  const directPostUrl = `${window.location.origin}/#pasangiklan`;

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directPostUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  useEffect(() => {
    if (isOpen) {
      setWebhookUrl(getFreeWebhookUrl());
      setBrevoConfig(getBrevoConfig());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveBrevo = (e: React.FormEvent) => {
    e.preventDefault();
    saveBrevoConfig(brevoConfig);
    if (onSuccessToast) {
      onSuccessToast('✅ Konfigurasi Brevo API berhasil disimpan!');
    }
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    saveFreeWebhookUrl(webhookUrl);
    if (onSuccessToast) {
      onSuccessToast('✅ Webhook Make.com berhasil disimpan!');
    }
  };

  const handleTestSend = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Mohon masukkan alamat email tujuan yang valid.');
      return;
    }

    setIsSending(true);
    setTestResult(null);

    // Simpan konfigurasi aktif terlebih dahulu
    if (activeTab === 'brevo') {
      saveBrevoConfig(brevoConfig);
    } else if (activeTab === 'make') {
      saveFreeWebhookUrl(webhookUrl);
    }

    try {
      const result = await sendWelcomeEmailAutomation({
        name: testName,
        email: testEmail,
        phone: '0812-8888-9999',
      });

      setTestResult(result);
      if (onSuccessToast) {
        onSuccessToast(`🎉 ${result.message}`);
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Mail className="w-6 h-6" />
          </div>
          <div className="pr-8">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Welcome Email 100% Gratis
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200">
                Tanpa Kartu Kredit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Alternatif gratis pengganti Zapier berbayar untuk mengirim email ke {defaultEmail}.
            </p>
          </div>
        </div>

        {/* Direct Link Banner ke Form Pasang Iklan untuk Email */}
        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 shadow-2xs space-y-1.5 shrink-0 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-sky-600" />
              <span>Direct Link Form Pasang Iklan (Untuk Email)</span>
            </span>
            <button
              type="button"
              onClick={handleCopyDirectLink}
              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
            >
              {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-sky-200">
            <code className="text-[11px] font-mono text-sky-900 select-all truncate grow font-semibold">
              {directPostUrl}
            </code>
          </div>
          <p className="text-[10px] text-sky-800">
            💡 Tautan ini otomatis langsung membuka formulir <strong>Pasang Iklan BU</strong> ketika diklik oleh user baru dari email mereka.
          </p>
        </div>

        {/* Tab Pilihan Solusi Otomatisasi Email */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl mt-4 mb-2 shrink-0 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('brevo')}
            className={`py-2 px-1 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'brevo'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🔵 Brevo API</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('make')}
            className={`py-2 px-1 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'make'
                ? 'bg-white text-sky-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🔄 Webhook</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('surat')}
            className={`py-2 px-1 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'surat'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>✉️ Surat</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-4 py-3 pr-1 text-xs text-slate-700 leading-relaxed">
          {/* ======================================================== */}
          {/* TAB: BREVO (300 EMAIL GRATIS/HARI - CRM & TRANSACTIONAL) */}
          {/* ======================================================== */}
          {activeTab === 'brevo' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-200 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black text-xs">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Brevo (Sendinblue): 300 Email Gratis Setiap Hari (9.000/Bulan)</span>
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  <strong>Brevo</strong> adalah platform transactional email dan CRM kelas dunia. 
                  Sangat mendukung <strong>otomatisasi welcome email</strong> dan <strong>sinkronisasi kontak pendaftar baru</strong> ke daftar CRM Anda!
                </p>
              </div>

              {/* Cara 1: Sambung ke Webhook Make.com yang sudah aktif */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs">
                    💡 Cara 1 (Paling Mudah): Hubungkan Brevo di Make.com Anda
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Tanpa Koding
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Karena URL Webhook Make.com sudah terpasang di web Anda, di skenario Make.com Anda cukup klik tombol <strong>+ (Add module)</strong> &gt; cari <strong>Brevo</strong> &gt; pilih <strong>Send a Transactional Email</strong> atau <strong>Create or Update a Contact</strong>. Selesai!
                </p>
              </div>

              {/* Cara 2: Direct API Key Brevo */}
              <form onSubmit={handleSaveBrevo} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cara 2: Direct Brevo API Key (Kirim Langsung via Server)</span>
                  </span>
                  <a
                    href="https://app.brevo.com/settings/keys/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 underline"
                  >
                    <span>Dapatkan API Key di Brevo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Brevo API Key (v3 - diawali <code>xkeysib-...</code>):
                    </label>
                    <input
                      type="password"
                      placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={brevoConfig.apiKey}
                      onChange={(e) =>
                        setBrevoConfig({ ...brevoConfig, apiKey: e.target.value.trim() })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Sender Email Terverifikasi di Brevo (Wajib Terverifikasi):
                    </label>
                    <input
                      type="email"
                      placeholder="admin@jualrugi.my.id"
                      value={brevoConfig.senderEmail || DEFAULT_BREVO_SENDER_EMAIL}
                      onChange={(e) =>
                        setBrevoConfig({ ...brevoConfig, senderEmail: e.target.value.trim() })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-500 font-mono"
                    />
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                      ✓ Sender resmi terotentikasi & branded domain: <code>admin@jualrugi.my.id</code> (JualRugi.my.id)
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition cursor-pointer shadow-xs active:scale-98"
                >
                  Simpan Konfigurasi Brevo
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: MAKE.COM (WEBHOOK GRATIS SELAMANYA TANPA CC)     */}
          {/* ======================================================== */}
          {activeTab === 'make' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200 space-y-1.5">
                <div className="flex items-center gap-2 text-sky-950 font-black text-xs">
                  <Zap className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Make.com (Integromat): Webhook Gratis 1.000 Transaksi/Bulan</span>
                </div>
                <p className="text-[11px] text-sky-900 leading-relaxed">
                  Berbeda dengan Zapier yang mengunci fitur Webhook di paket berbayar, di <strong>Make.com</strong> fitur <strong>Custom Webhook adalah GRATIS SELAMANYA tanpa perlu kartu kredit</strong>!
                </p>
              </div>

              {/* Form Input Webhook Make.com */}
              <form onSubmit={handleSaveWebhook} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-extrabold text-xs text-slate-900">
                    Masukkan Webhook URL Make.com Anda:
                  </span>
                  <a
                    href="https://www.make.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 underline"
                  >
                    <span>Daftar di make.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="url"
                  placeholder="https://hook.eu1.make.com/xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value.trim())}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 outline-none focus:border-sky-500"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition cursor-pointer shadow-xs active:scale-98"
                >
                  Simpan Webhook Make.com
                </button>
              </form>

              {/* Cara Pakai Make.com */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs">
                  Cara Buat Skenario di Make.com (Gratis):
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 pl-1">
                  <li>Buka <a href="https://www.make.com" target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline">make.com</a> dan buat akun gratis.</li>
                  <li>Klik <strong>Create a new scenario</strong> &gt; Tambah modul: <strong>Webhooks</strong> &gt; pilih <strong>Custom Webhook</strong>. Salin link URL-nya ke form di atas.</li>
                  <li>Tambah modul kedua di sebelahnya: pilih <strong>Gmail</strong> &gt; <strong>Send an Email</strong>. Hubungkan Gmail Anda, isi kolom To dengan variabel email.</li>
                  <li>Aktifkan saklar <strong>Scheduling: ON</strong> di pojok kiri bawah. Selesai!</li>
                </ol>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SURAT IN-APP (PANDUAN & KUOTA LANGSUNG DI LAYAR)  */}
          {/* ======================================================== */}
          {activeTab === 'surat' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center justify-between text-xs">
                <span className="font-bold">✉️ Surat Resmi Selamat Datang JualRugi.my.id</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                  Bonus 1 Kuota Aktif
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="text-center pb-3 border-b border-slate-100">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-sky-100 text-sky-800 font-black text-[10px] uppercase">
                    Pemberitahuan Akun Baru
                  </span>
                  <h3 className="text-base font-black text-slate-950 mt-1.5">
                    Selamat Bergabung di JualRugi.my.id! 👋
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Akun: <strong>{testEmail}</strong>
                  </p>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  Halo <strong>{testName}</strong>, akun Anda telah aktif dan siap digunakan untuk mencari produk diskon ekstrim BU atau menjual barang Anda.
                </p>

                <div className="p-3.5 rounded-2xl bg-amber-50/90 border-l-4 border-amber-400 text-amber-950 space-y-1.5 text-[11px]">
                  <strong>🛡️ 3 Tips Aman Transaksi COD:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-900 pl-1">
                    <li>Wajib COD tatap muka di tempat umum yang ramai.</li>
                    <li>Jangan pernah mentransfer DP / uang muka sebelum cek fisik.</li>
                    <li>Uji fungsi tombol, baterai, dan IMEI bersama penjual.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-black">🎁 Bonus Registrasi: 1 Slot Iklan Gratis</p>
                    <p className="text-[10px] text-emerald-700">Sudah otomatis aktif di akun Anda</p>
                  </div>
                  <span className="text-xl">🎉</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* UJI COBA PENGIRIMAN REAL-TIME                            */}
          {/* ======================================================== */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Uji Coba Kirim Email Sekarang ({testEmail}):</span>
              </h4>
              <span className="text-[10px] text-slate-400">Metode: {activeTab.toUpperCase()}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Email tujuan (cth: bca.ccpl@gmail.com)"
                className="grow px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-mono text-white placeholder:text-white/40 outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={handleTestSend}
                disabled={isSending}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                <span>{isSending ? 'Mengirim...' : 'Tes Kirim Sekarang'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-[11px] animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    : 'bg-rose-500/20 border-rose-400 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Solusi Gratis Selamanya • Bebas Kartu Kredit</span>
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
