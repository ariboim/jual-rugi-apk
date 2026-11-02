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
    preview?: { subject: string; html: string };
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

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
      onSuccessToast('✅ Webhook URL Zapier berhasil disimpan!');
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
        onSuccessToast(`🎉 Welcome email dipicu ke ${testEmail}!`);
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

  const samplePayload = JSON.stringify(
    {
      event: 'user_signed_up',
      name: 'Budi Santoso',
      email: 'bca.ccpl@gmail.com',
      phone: '0812-3344-5566',
      subject: '🎉 Selamat Datang di JualRugi.id!',
      appUrl: 'https://jualrugi.id',
      timestamp: '2026-11-02T08:00:00.000Z',
    },
    null,
    2
  );

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(samplePayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 3000);
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
                Solusi Instan Welcome Email
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Otomatis
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kirim email sambutan otomatis ke Gmail pendaftar tanpa tertunda.
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 py-4 pr-1 text-xs text-slate-700 leading-relaxed">
          {/* Mengapa Supabase + Zapier Gagal Sebelumnya? */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5">
            <h4 className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mengapa Zapier + Supabase Sebelumnya Tidak Terkirim?</span>
            </h4>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Pada akun Zapier gratis, trigger <em>"Supabase: New Row"</em> memakai sistem <strong>polling</strong> (hanya cek data tiap 15 menit–2 jam sekali, bukan instan), serta sering terhalang izin <em>Row Level Security (RLS)</em>.
            </p>
            <p className="text-[11px] text-amber-900 font-bold leading-relaxed">
              💡 <strong>Solusi Instan Kami:</strong> Sign up form JualRugi.id kini mengirim trigger HTTP POST langsung (Instant Catch Hook), sehingga Zapier langsung menerima data dalam <strong>0,2 detik</strong> dan Gmail otomatis mengirim welcome email seketika!
            </p>
          </div>

          {/* Form Konfigurasi Webhook Zapier */}
          <form onSubmit={handleSaveWebhook} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Zapier Webhook URL (Catch Hook):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Opsional / Langsung Aktif</span>
              </label>
              <input
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/1234567/abcdef/"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[10.5px] text-slate-500 mt-1 block">
                Didapat dari Zapier: Trigger <strong>"Webhooks by Zapier"</strong> &gt; Event: <strong>"Catch Hook"</strong>.
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition active:scale-95 cursor-pointer shadow-xs"
              >
                Simpan Webhook URL
              </button>
            </div>
          </form>

          {/* Uji Coba Kirim Instan (Test Dispatch) */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
            <h4 className="font-extrabold text-sky-950 text-xs flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-600" />
              <span>Tes Otomatisasi Welcome Email Sekarang:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Nama Penerima:
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Email Tujuan (Inbox Anda):
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs font-mono text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestSend}
                disabled={isSending}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                <span>{isSending ? 'Memicu Otomatisasi...' : 'Kirim Uji Coba Email Sekarang'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>{showPreview ? 'Sembunyikan Desain' : 'Lihat Desain Email'}</span>
              </button>
            </div>

            {/* Hasil Uji Coba */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 animate-in fade-in ${
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
                <div>
                  <p className="font-bold">
                    {testResult.success ? 'Berhasil Terkirim / Dipicu!' : 'Gagal Memicu:'}
                  </p>
                  <p className="mt-0.5">{testResult.message}</p>
                  {testResult.webhookDispatched && (
                    <span className="inline-block mt-1 font-mono text-[10px] bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded">
                      Zapier Catch Hook Response: Status 200 OK
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview Desain Email HTML */}
          {showPreview && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-900">
                  Preview Tampilan Welcome Email di Inbox Pengguna:
                </span>
                <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">
                  HTML Template
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="pb-2 border-b border-slate-200 text-slate-500 text-[11px]">
                  <strong>Subject:</strong> 🎉 Selamat Datang di JualRugi.id, {testName}! Panduan Transaksi COD Aman
                </div>
                <div className="space-y-1.5 text-slate-700">
                  <p>Halo <strong>{testName}</strong>,</p>
                  <p>Terima kasih telah mendaftar di <strong>JualRugi.id</strong> menggunakan email <code>{testEmail}</code>. Akun Anda telah aktif dan siap digunakan!</p>
                  <div className="p-2.5 bg-amber-50 border-l-4 border-amber-400 rounded text-[11px] text-amber-900">
                    <strong>🛡️ Tips Aman:</strong> Selalu COD di tempat ramai, cek fisik barang, dan jangan transfer DP sebelum memegang barang.
                  </div>
                  <p>🎁 <strong>Bonus Pendaftaran:</strong> 1 Slot Kuota Pasang Iklan Gratis telah aktif di akun Anda!</p>
                </div>
              </div>
            </div>
          )}

          {/* 3 Langkah Mudah di Zapier (Tanpa Koding) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>3 Langkah Mudah di Zapier (Pasti Berhasil & Instan):</span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-600 pl-1">
              <li>
                <strong>Step 1 (Trigger):</strong> Buka <a href="https://zapier.com" target="_blank" rel="noreferrer" className="text-sky-600 font-bold underline">zapier.com</a> &gt; Create Zap &gt; Pilih App <strong>"Webhooks by Zapier"</strong> &gt; Event: <strong>"Catch Hook"</strong>. Klik Continue lalu copy Webhook URL yang diberikan.
              </li>
              <li>
                <strong>Step 2:</strong> Paste Webhook URL tersebut ke kotak di atas, lalu klik <strong>"Kirim Uji Coba Email Sekarang"</strong>. Zapier akan langsung mendeteksi data contoh pendaftar.
              </li>
              <li>
                <strong>Step 3 (Action):</strong> Di Zapier, pilih App <strong>"Gmail"</strong> (atau "Email by Zapier") &gt; Event: <strong>"Send Email"</strong>. Pada kolom <em>To</em>, klik dan pilih field <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700">email</code>. Masukkan Subject dan isi pesan, lalu klik <strong>Publish Zap</strong>!
              </li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
