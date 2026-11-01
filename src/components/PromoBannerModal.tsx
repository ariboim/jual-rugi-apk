import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface PromoBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBannerAction: () => void;
  isLoggedIn?: boolean;
}

/**
 * Banner Pembuka Interaktif (Vertical Popup Modal)
 * Menggunakan asset visual image_3.png (1793501947913_573c05e1.jpg)
 * 
 * Aturan Teknis:
 * 1. Countdown 3 detik pada tombol Tutup di kanan atas:
 *    - 3s -> 2s -> 1s: Disabled / non-clickable
 *    - 0s: Berubah menjadi "Tutup ✕" aktif dan clickable
 * 2. Auto-close otomatis setelah 5 detik jika tidak ada interaksi
 * 3. Klik area banner / tombol "MASUK / DAFTAR SEKARANG" mengecek status login:
 *    - Jika belum login: Mengarahkan ke form Daftar/Login (AuthModal)
 *    - Jika sudah login: Menutup banner dan langsung ke Home
 */
export const PromoBannerModal: React.FC<PromoBannerModalProps> = ({
  isOpen,
  onClose,
  onBannerAction,
  isLoggedIn = false,
}) => {
  const [countdown, setCountdown] = useState<number>(3);
  const [canClose, setCanClose] = useState<boolean>(false);

  // Reset countdown saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(3);
    setCanClose(false);

    // Interval hitung mundur 3 detik (3s -> 2s -> 1s -> 0s)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-dismiss setelah 5 detik jika pengguna tidak berinteraksi
    const autoDismiss = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoDismiss);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canClose) {
      onClose();
    }
  };

  const handleBannerClick = () => {
    onBannerAction();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div
        onClick={handleBannerClick}
        className="relative w-full max-w-[340px] sm:max-w-[390px] aspect-[9/16] max-h-[92vh] sm:max-h-[88vh] rounded-3xl overflow-hidden shadow-2xl shadow-red-950/50 border border-white/20 select-none cursor-pointer group my-auto transition-transform active:scale-[0.99]"
      >
        {/* Background Poster Image */}
        <img
          src="/assets/aistudio/1793501947913_573c05e1.jpg"
          alt="Semua Barang Harga Gila Ada di Sini! - JualRugi.id"
          className="w-full h-full object-cover object-center pointer-events-none"
          onError={(e) => {
            // Fallback path
            (e.target as HTMLImageElement).src = '/assets/aistudio/image_3.png';
          }}
        />

        {/* Top-Right Interactive Countdown Close Button Overlay */}
        <div
          className="absolute top-4 right-4 z-20 flex flex-col items-end"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleCloseClick}
            disabled={!canClose}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all duration-300 flex items-center gap-1.5 shadow-md ${
              canClose
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer active:scale-95 border border-white/80 ring-2 ring-red-400 animate-pulse'
                : 'bg-black/70 text-white/90 border border-white/30 cursor-not-allowed opacity-90'
            }`}
            title={canClose ? 'Tutup banner' : `Tunggu ${countdown} detik untuk menutup`}
          >
            <span>
              {canClose ? 'Tutup' : `Tutup (${countdown}s)`}
            </span>
            <X className={`w-3.5 h-3.5 ${canClose ? 'stroke-[3]' : 'stroke-[2]'}`} />
          </button>

          {!canClose && (
            <span className="text-[9px] font-bold text-white/90 drop-shadow-md mt-1 tracking-tight pr-1">
              Akan menutup otomatis dalam 3 detik
            </span>
          )}
        </div>

        {/* Bottom CTA Button Clickable Hotspot with Pulse Animation */}
        <div className="absolute bottom-6 sm:bottom-8 left-4 right-4 z-20 flex flex-col items-center">
          <div className="w-full py-3 sm:py-3.5 px-4 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase text-center shadow-xl shadow-amber-950/40 border-2 border-white flex items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-4 h-4 text-red-600 fill-red-600 animate-pulse" />
            <span>MASUK / DAFTAR SEKARANG</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-md mt-1.5">
            Klik untuk masuk/daftar & nikmati promonya!
          </span>
        </div>
      </div>
    </div>
  );
};
