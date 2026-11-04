import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface EditModerationModalProps {
  isOpen: boolean;
  listingTitle?: string;
  onConfirm: () => void;
  autoCloseSeconds?: number;
}

/**
 * Modal Konfirmasi Pasca-Edit Iklan
 * Pesan: "Edit iklan berhasil dan sedang dalam moderasi tayang, mohon ditunggu."
 * Tombol: "Saya Paham"
 */
export const EditModerationModal: React.FC<EditModerationModalProps> = ({
  isOpen,
  listingTitle,
  onConfirm,
  autoCloseSeconds = 7,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(autoCloseSeconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(autoCloseSeconds);
      return;
    }

    setSecondsLeft(autoCloseSeconds);

    const timer = setInterval(() => {
      if (!isPaused) {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onConfirm();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, autoCloseSeconds, onConfirm]);

  if (!isOpen) return null;

  const progressPercent = ((autoCloseSeconds - secondsLeft) / autoCloseSeconds) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-moderation-title"
    >
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden transform animate-scale-up text-slate-800"
      >
        {/* Banner Ilustrasi & Icon Moderasi */}
        <div className="relative bg-gradient-to-br from-amber-400 via-amber-500 to-sky-600 p-6 text-white text-center overflow-hidden">
          {/* Subtle Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-black/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white text-amber-600 flex items-center justify-center shadow-lg shadow-amber-950/20 mb-3 animate-bounce">
              <Clock className="w-8 h-8 stroke-[2.5]" />
            </div>

            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white">
              Status Pembaruan Iklan
            </span>

            <h3
              id="edit-moderation-title"
              className="text-lg sm:text-xl font-black mt-2 text-white leading-tight"
            >
              Moderasi Uang & Kualitas
            </h3>
          </div>
        </div>

        {/* Konten Utama Pesan Resmi */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-center">
            <p className="text-sm sm:text-base font-extrabold text-amber-950 leading-relaxed">
              Edit iklan berhasil dan sedang dalam moderasi tayang, mohon ditunggu.
            </p>
            {listingTitle && (
              <p className="text-xs font-semibold text-amber-800 mt-1 line-clamp-1">
                Produk: "{listingTitle}"
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Sistem kami memeriksa ulang kelayakan harga diskon, kondisi fisik, dan lokasi COD agar pembeli mendapatkan penawaran yang valid dan terpercaya.
          </p>

          {/* Progress Bar Auto-Close Timer */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
              <span>{isPaused ? '⏸️ Timer dijeda' : `Otomatis ditutup dalam ${secondsLeft} detik`}</span>
              <span>Klik di bawah untuk langsung lanjut</span>
            </div>
          </div>

          {/* Tombol Utama: SAYA PAHAM */}
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
          >
            <span>Saya Paham</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
