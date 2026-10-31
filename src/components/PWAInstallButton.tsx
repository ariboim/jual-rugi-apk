import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          aria-label="Install Aplikasi JualRugi"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs shadow-sky-500/25 transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-white animate-bounce" />
          <span>Install App</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          aria-label="Panduan Install di iPhone"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5 text-sky-500" />
          <span>Install iOS</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/35 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-sky-100 p-5 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/aistudio/logo_icon_transparent.png"
                  alt="JualRugi.id"
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h3 className="text-sm font-bold text-sky-950">Pasang JualRugi.id di iPhone</h3>
                  <p className="text-[11px] text-slate-500">Akses cepat tanpa buka browser</p>
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
                  Gulir ke bawah lalu pilih opsi <strong className="text-sky-950">Tambah ke Layar Utama / Add to Home Screen</strong> (<PlusSquare className="inline w-3.5 h-3.5 text-sky-500" />).
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-sky-50/60 p-2.5 rounded-xl border border-sky-100">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <p>
                  Ketuk <strong className="text-sky-950">Tambah / Add</strong> di pojok kanan atas. Ikon JualRugi.id akan muncul di layar iPhone Anda!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition cursor-pointer shadow-xs shadow-sky-500/25"
            >
              Mengerti, Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
