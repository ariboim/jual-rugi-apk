import React, { useState } from 'react';
import {
  Download,
  Share2,
  PlusSquare,
  X,
  CheckCircle,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { BrandLogo } from './BrandLogo';

// Direct GitHub Release APK Download URL
export const APK_DOWNLOAD_URL =
  'https://github.com/ariboim/jual-rugi-apk/releases/latest/download/app-debug.apk';
export const APK_REDIRECT_URL =
  'https://www.google.com/url?sa=E&q=https%3A%2F%2Fgithub.com%2Fariboim%2Fjual-rugi-apk%2Freleases%2Flatest%2Fdownload%2Fapp-debug.apk';

export const PWAInstallButton: React.FC = () => {
  const { isInstalled, isIOS } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // If already running inside standalone app / installed APK
  if (isInstalled) {
    return (
      <span className="hidden md:flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span>Aplikasi Aktif</span>
      </span>
    );
  }

  const handleDownloadClick = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 8000);
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Tombol Utama: Download & Pasang File APK Real Android (Tanpa Logo Browser) */}
        <a
          href={APK_DOWNLOAD_URL}
          onClick={handleDownloadClick}
          download="app-debug.apk"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download & Install File APK Real JualRugi"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-xs shadow-sky-500/25 transition-all active:scale-95 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-white" />
          <span className="font-extrabold tracking-wide">Install APK Real</span>
          <Download className="w-3 h-3 text-sky-200 animate-bounce" />
        </a>

        {/* Tombol Bantuan / Panduan */}
        <button
          onClick={() => setShowModal(true)}
          title="Petunjuk Pasang APK Real Tanpa Logo Browser"
          className="p-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition cursor-pointer active:scale-95 shadow-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
        </button>

        {/* Khusus perangkat iOS / iPhone */}
        {isIOS && (
          <button
            onClick={() => setShowModal(true)}
            aria-label="Panduan Install di iPhone"
            className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Share2 className="w-3 h-3 text-sky-500" />
            <span className="hidden xs:inline">iOS</span>
          </button>
        )}
      </div>

      {/* Floating Notification Toast saat tombol Install/Download diklik */}
      {showToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-sky-500/30 flex items-start gap-3 animate-fade-in">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
            <Download className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-sky-300 flex items-center gap-1.5">
              <span>Mengunduh File APK Asli (Real App)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-800 text-sky-200">
                app-debug.apk
              </span>
            </h4>
            <p className="mt-1 text-slate-300 leading-relaxed">
              File <strong>app-debug.apk</strong> sedang diunduh. Setelah selesai, ketuk file di bilah notifikasi HP Anda lalu pilih <strong>Install</strong>.
            </p>
            <p className="mt-1 text-amber-300 font-semibold text-[11px]">
              ⭐ Ikon di layar HP dijamin 100% bersih murni tanpa ada logo browser Chrome!
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowToast(false);
                  setShowModal(true);
                }}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat petunjuk lengkap</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Dialog Panduan Install APK Real & Bebas Badge Browser */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-2xl text-slate-800 my-auto animate-scale-up">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3.5 border-b border-sky-100">
              <div className="flex items-center gap-2.5">
                <BrandLogo size="sm" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Pasang Aplikasi Real Android</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    100% Bersih • Tanpa Logo Browser di Ikon
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Penjelasan */}
            <div className="mt-4 space-y-3.5 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-emerald-950 leading-relaxed">
                  <strong>Kenapa menggunakan File APK?</strong> Menginstall file APK asli menghasilkan aplikasi mandiri sejati di HP Anda. Ikon launcher dijamin <strong>bersih 100% tanpa watermark/logo kecil Chrome</strong> di sudutnya!
                </div>
              </div>

              {/* Langkah-langkah Pasang APK di Android */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                  <span>3 Langkah Pasang APK di HP Android:</span>
                </h4>

                <div className="space-y-2 text-slate-700">
                  <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <p className="text-[11.5px] leading-snug">
                      Ketuk tombol <strong>"Download File APK Sekarang"</strong> di bawah. File <code>app-debug.apk</code> akan mulai terunduh ke HP Anda.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <p className="text-[11.5px] leading-snug">
                      Tarik bilah notifikasi HP Anda ke bawah, ketuk file <strong>app-debug.apk</strong> yang telah selesai diunduh.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <p className="text-[11.5px] leading-snug">
                      Pilih <strong>Install</strong> (jika diminta, izinkan <em>"Install dari sumber ini"</em>). Ikon aplikasi <strong>JualRugi</strong> bersih tanpa logo browser akan muncul di layar HP Anda!
                    </p>
                  </div>
                </div>
              </div>

              {/* Khusus Pengguna iPhone */}
              {isIOS && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Untuk Pengguna iPhone (iOS):</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Ketuk tombol <strong>Share</strong> di Safari &gt; pilih <strong>"Tambah ke Layar Utama"</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-5 pt-3 border-t border-sky-100 flex items-center gap-2">
              <a
                href={APK_DOWNLOAD_URL}
                download="app-debug.apk"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setShowModal(false);
                  setShowToast(true);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File APK Sekarang</span>
              </a>

              <button
                onClick={() => setShowModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
