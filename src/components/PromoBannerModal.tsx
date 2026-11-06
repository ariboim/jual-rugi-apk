import React, { useState } from 'react';
import { X, Sparkles, Flame, ArrowRight, ShieldCheck } from 'lucide-react';

interface PromoBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBannerAction: () => void;
  isLoggedIn?: boolean;
}

/**
 * Banner Pembuka Interaktif (Vertical Promo Modal)
 * Menggunakan asset poster visual resmi (/image_3.png)
 * 
 * Perbaikan penting:
 * 1. Tidak lagi auto-dismiss (tidak menghilang otomatis dalam 3 detik) sehingga pengunjung
 *    bisa membaca promo secara utuh dan mengklik dengan nyaman.
 * 2. Tombol "Tutup" (X) yang jelas dan kontras tinggi di pojok kanan atas.
 * 3. Fallback visual poster darurat jika gambar lambat dimuat di koneksi mobile.
 */
export const PromoBannerModal: React.FC<PromoBannerModalProps> = ({
  isOpen,
  onClose,
  onBannerAction,
  isLoggedIn = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

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
        className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] max-h-[92vh] sm:max-h-[88vh] rounded-3xl overflow-hidden shadow-2xl shadow-red-950/60 border border-white/20 select-none cursor-pointer group my-auto transition-transform active:scale-[0.99] bg-gradient-to-b from-red-600 via-orange-600 to-amber-600 flex flex-col justify-between"
      >
        {/* Tombol Tutup Bersih (Interactive Close Button) di Pojok Kanan Atas */}
        <button
          type="button"
          onClick={handleCloseClick}
          aria-label="Tutup banner"
          className="absolute top-3.5 right-3.5 z-40 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white font-bold text-xs border border-white/30 shadow-lg backdrop-blur-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
          title="Tutup promo banner"
        >
          <span>Tutup</span>
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {!imageError ? (
          <>
            {/* Background Poster Artwork Utama (/image_3.png) */}
            <img
              src={triedFallback ? '/assets/aistudio/image_3.png' : '/image_3.png'}
              alt="Semua Barang Harga Gila Ada di Sini! - JualRugi.my.id"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              onError={() => {
                if (!triedFallback) {
                  setTriedFallback(true);
                } else {
                  setImageError(true);
                }
              }}
            />

            {/* Hotspot Interaktif Tombol CTA Bagian Bawah dengan Efek Hover Halus */}
            <div
              className="absolute bottom-6 sm:bottom-8 left-4 right-4 h-16 z-20 rounded-full cursor-pointer group-hover:ring-4 group-hover:ring-amber-300/50 transition-all duration-200"
              title="Klik untuk masuk atau buka katalog promo"
            />
          </>
        ) : (
          /* Fallback Poster Card jika gambar gagal/lambat di jaringan HP */
          <div className="relative z-10 p-6 flex flex-col justify-between h-full text-white">
            <div className="space-y-3 pt-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase tracking-wider text-amber-300 border border-white/20">
                <Flame className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
                Promo Spesial JualRugi
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-sm">
                SEMUA BARANG HARGA GILA ADA DI SINI!
              </h2>

              <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed">
                Temukan smartphone, gadget, laptop, dan motor dengan diskon butuh uang (BU) ekstrem 15% - 45% di bawah harga pasaran normal!
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-white/90">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>100% Wajib COD Tatap Muka Tanpa DP</span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <button
                type="button"
                onClick={handleBannerClick}
                className="w-full py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>Buka Katalog Promo Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-white/80">
                Ketuk di mana saja untuk melihat barang diskon
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
