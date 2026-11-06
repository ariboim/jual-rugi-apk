import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle, Smartphone, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { BrandLogo } from './BrandLogo';

// Direct GitHub Release APK Download URL
export const APK_DOWNLOAD_URL = "https://github.com/ariboim/jual-rugi-apk/releases/latest/download/app-debug.apk";
export const APK_REDIRECT_URL = "https://www.google.com/url?sa=E&q=https%3A%2F%2Fgithub.com%2Fariboim%2Fjual-rugi-apk%2Freleases%2Flatest%2Fdownload%2Fapp-debug.apk";

export const PWAInstallButton: React.FC = () => {
  const { isInstalled, isIOS } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidToast, setShowAndroidToast] = useState(false);

  // If already running inside standalone app / installed APK
  if (isInstalled) {
    return (
      <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span>Aplikasi Aktif</span>
      </span>
    );
  }

  const handleDownloadClick = () => {
    setShowAndroidToast(true);
    setTimeout(() => {
      setShowAndroidToast(false);
    }, 8000);
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Tombol Utama: Download & Install APK Android Langsung */}
        <a
          href={APK_DOWNLOAD_URL}
          onClick={handleDownloadClick}
          download="app-debug.apk"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download & Install APK Android JualRugi"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-xs shadow-sky-500/25 transition-all active:scale-95 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-white" />
          <span className="font-extrabold tracking-wide">Install App</span>
          <Download className="w-3 h-3 text-sky-200 animate-bounce" />
        </a>

        {/* Khusus perangkat iOS / iPhone */}
        {isIOS && (
          <button
            onClick={() => setShowIOSGuide(true)}
            aria-label="Panduan Install di iPhone"
            className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Share2 className="w-3 h-3 text-sky-500" />
            <span className="hidden xs:inline">iOS</span>
          </button>
        )}
      </div>

      {/* Floating Notification Toast saat tombol Install/Download diklik */}
      {showAndroidToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-sky-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
            <Download className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-sky-300 flex items-center gap-1.5">
              <span>Mengunduh File APK Android</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-800 text-sky-200">app-debug.apk</span>
            </h4>
            <p className="mt-1 text-slate-300 leading-relaxed">
              Jika file sudah selesai terunduh di bilah notifikasi ponsel Anda, ketuk file tersebut lalu pilih <strong>Install</strong> untuk memasang aplikasi JualRugi.my.id di layar HP Anda.
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline flex items-center gap-1"
              >
                <span>Unduh ulang jika belum mulai</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button
            onClick={() => setShowAndroidToast(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Panduan iOS Safari */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-sky-100 p-5 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <BrandLogo size="sm" />
                <div>
                  <h3 className="text-sm font-bold text-sky-950">Install di iPhone / iPad</h3>
                  <p className="text-[11px] text-slate-500">Pasang icon web ke Layar Utama</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-sky-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <p>
                  Ketuk tombol <strong className="text-sky-950">Share</strong> (ikon kotak dengan panah atas <Share2 className="inline w-3.5 h-3.5 text-sky-600" />) di bilah bawah browser Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <p>
                  Gulir ke bawah lalu pilih <strong className="text-sky-950">Tambah ke Layar Utama / Add to Home Screen</strong> (<PlusSquare className="inline w-3.5 h-3.5 text-sky-500" />).
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <p>
                  Ketuk <strong className="text-sky-950">Tambah / Add</strong> di pojok kanan atas.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-sky-100 flex flex-col gap-2">
              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span>Download File APK Android</span>
              </a>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition cursor-pointer shadow-xs shadow-sky-500/25"
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
