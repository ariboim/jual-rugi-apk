import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PromoBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBannerAction: () => void;
  isLoggedIn?: boolean;
}

/**
 * Banner Pembuka Interaktif (Vertical Promo Modal)
 * Menggunakan asset poster visual resmi (1793501947913_573c05e1.jpg)
 * 
 * Catatan Desain:
 * Gambar poster asli sudah memuat tipografi grafis lengkap:
 * - "MASUK / DAFTAR SEKARANG" di bagian bawah
 * - "Tutup (3s)" di bagian kanan atas
 * Oleh karena itu, elemen teks HTML duplikat dihilangkan agar tampilan
 * tidak menumpuk / kembar dan terlihat 100% tajam & profesional.
 */
export const PromoBannerModal: React.FC<PromoBannerModalProps> = ({
  isOpen,
  onClose,
  onBannerAction,
  isLoggedIn = false,
}) => {
  const [canClose, setCanClose] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    setCanClose(false);

    // Boleh ditutup setelah 1 detik
    const closeTimer = setTimeout(() => {
      setCanClose(true);
    }, 1000);

    // Auto-dismiss otomatis setelah 5 detik
    const autoDismiss = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(closeTimer);
      clearTimeout(autoDismiss);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleBannerClick = () => {
    onBannerAction();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleBannerClick();
        }}
        className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] max-h-[92vh] sm:max-h-[88vh] rounded-3xl overflow-hidden shadow-2xl shadow-red-950/50 border border-white/20 select-none cursor-pointer group my-auto transition-transform active:scale-[0.99]"
      >
        {/* Background Poster Artwork Lengkap (Tanpa Timpaan Teks Ganda) */}
        <img
          src="/assets/aistudio/1793501947913_573c05e1.jpg"
          alt="Semua Barang Harga Gila Ada di Sini! - JualRugi.id"
          className="w-full h-full object-cover object-center pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/aistudio/image_3.png';
          }}
        />

        {/* Tombol Tutup Bersih (Interactive Close Button) di Pojok Kanan Atas */}
        <button
          type="button"
          onClick={handleCloseClick}
          aria-label="Tutup banner"
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white border border-white/40 shadow-lg backdrop-blur-xs transition cursor-pointer active:scale-95 flex items-center justify-center"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Hotspot Interaktif Tombol CTA Bagian Bawah dengan Efek Hover Halus */}
        <div
          className="absolute bottom-6 sm:bottom-8 left-4 right-4 h-16 z-20 rounded-full cursor-pointer group-hover:ring-4 group-hover:ring-amber-300/40 transition-all duration-200"
          title="Klik untuk masuk atau daftar sekarang"
        />
      </div>
    </div>
  );
};
