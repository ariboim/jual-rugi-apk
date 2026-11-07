import React, { useState } from 'react';
import {
  Download,
  Share2,
  PlusSquare,
  X,
  CheckCircle,
  Smartphone,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { BrandLogo } from './BrandLogo';

// Direct GitHub Release APK Download URL
export const APK_DOWNLOAD_URL =
  'https://github.com/ariboim/jual-rugi-apk/releases/latest/download/app-debug.apk';
export const APK_REDIRECT_URL =
  'https://www.google.com/url?sa=E&q=https%3A%2F%2Fgithub.com%2Fariboim%2Fjual-rugi-apk%2Freleases%2Flatest%2Fdownload%2Fapp-debug.apk';

export const PWAInstallButton: React.FC = () => {
  const { isInstalled, isInstallable, isIOS, install } = usePWAInstall();
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

  const handleInstallClick = async () => {
    // 1. Coba pemicu install resmi browser (Chrome WebAPK Native Prompt)
    if (isInstallable) {
      try {
        const installed = await install();
        if (installed) {
          setShowToast(true);
          setTimeout(() => setShowToast(false), 5000);
          return;
        }
      } catch (err) {
        console.warn('Native PWA install prompt error:', err);
      }
    }

    // 2. Jika prompt native belum tersedia atau perangkat iOS/WebView, buka panduan install terpadu
    setShowModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Tombol Utama: Install Aplikasi Otomatis (PWA WebAPK / Android Native) */}
        <button
          onClick={handleInstallClick}
          aria-label="Install Aplikasi JualRugi ke Layar HP"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-xs shadow-sky-500/25 transition-all active:scale-95 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-white" />
          <span className="font-extrabold tracking-wide">Install App</span>
          <Download className="w-3 h-3 text-sky-200 animate-bounce" />
        </button>

        {/* Tombol Khusus iOS / iPhone */}
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

      {/* Toast Notifikasi Berhasil Pasang */}
      {showToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-emerald-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold text-sm text-emerald-200">Aplikasi Berhasil Dipasang!</h4>
            <p className="text-emerald-100 mt-0.5">
              Ikon JualRugi telah ditambahkan ke layar utama ponsel Anda dan selalu terupdate otomatis.
            </p>
          </div>
        </div>
      )}

      {/* Modal Dialog Panduan Install Resmi (Solusi Permanen untuk Android & iOS) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-2xl text-slate-800 my-auto animate-scale-up">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3.5 border-b border-sky-100">
              <div className="flex items-center gap-2.5">
                <BrandLogo size="sm" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Install Aplikasi JualRugi</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Aplikasi Resmi • Selalu Mutakhir Otomatis
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

            {/* Content: Penjelasan Mengapa Harus Install via Browser */}
            <div className="mt-4 space-y-3.5 text-xs">
              <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-3 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-sky-950 leading-relaxed">
                  <strong>Kenapa install via browser?</strong> Aplikasi web resmi (PWA) terhubung langsung ke sistem live kami: logo tidak akan pecah, banner promo selalu aktif, dan bebas bug APK lama!
                </div>
              </div>

              {/* Langkah Install Android Chrome */}
              {!isIOS ? (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                    <span>Langkah Mudah di Google Chrome Android:</span>
                  </h4>

                  <div className="space-y-2 text-slate-700">
                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        1
                      </span>
                      <p className="text-[11.5px] leading-snug">
                        Ketuk <strong>menu titik tiga (⋮)</strong> di pojok kanan atas browser Chrome Anda.
                      </p>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        2
                      </span>
                      <p className="text-[11.5px] leading-snug">
                        Pilih menu <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        3
                      </span>
                      <p className="text-[11.5px] leading-snug">
                        Ketuk <strong>Install</strong>. Ikon resmi JualRugi akan langsung muncul di layar HP Anda!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Langkah Install iPhone / Safari */
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Langkah di Safari iPhone / iPad:</span>
                  </h4>

                  <div className="space-y-2 text-slate-700">
                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        1
                      </span>
                      <p className="text-[11.5px] leading-snug">
                        Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah atas <Share2 className="inline w-3 h-3 text-sky-600" />) di bilah bawah Safari.
                      </p>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        2
                      </span>
                      <p className="text-[11.5px] leading-snug">
                        Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama"</strong> (<PlusSquare className="inline w-3 h-3 text-sky-500" />).
                      </p>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        3
                      </span>
                      <p className="text-[11.5px] leading-snug">
                        Ketuk <strong>Tambah</strong> di pojok kanan atas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Opsi alternatif APK Manual */}
              <div className="pt-2 border-t border-slate-100">
                <div className="bg-amber-50/70 border border-amber-200/70 p-2.5 rounded-xl flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-900 leading-tight">
                    <strong>Catatan APK Manual:</strong> Jika Anda sebelumnya menginstall file APK fisik yang tampilannya berbeda (logo pecah), silakan <strong>Uninstall APK lama</strong> tersebut, lalu gunakan fitur <strong>Install via Chrome</strong> di atas agar tampilan 100% normal dan otomatis terupdate.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 pt-3 border-t border-sky-100 flex items-center gap-2">
              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowModal(false);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Sekarang</span>
                </button>
              )}

              <button
                onClick={() => setShowModal(false)}
                className={`py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer active:scale-95 ${
                  !isInstallable ? 'w-full' : ''
                }`}
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
