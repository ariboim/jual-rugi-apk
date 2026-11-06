import React, { useState } from 'react';
import { Flame, Sparkles, ArrowRight, Tag, Smartphone } from 'lucide-react';

interface TopPromoBannerProps {
  onNavigateCategory: () => void;
  className?: string;
}

/**
 * TopPromoBanner Component
 * Banner promo horizontal responsif tepat di bawah header & sebelum Kategori Pilihan.
 * Dilengkapi proteksi failover grafis murni:
 * Jika file gambar (/banner-hp-jualrugi.png) tidak ditemukan di hosting/CDN,
 * banner otomatis menampilkan poster grafis dinamis berbasis CSS & SVG
 * sehingga tampilan web SELALU normal, rapi, dan menarik tanpa broken image.
 */
export const TopPromoBanner: React.FC<TopPromoBannerProps> = ({
  onNavigateCategory,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-red-200/60 shadow-md bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 select-none ${className}`}
    >
      <div
        onClick={onNavigateCategory}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onNavigateCategory();
          }
        }}
        className="group relative w-full block cursor-pointer transition active:scale-[0.99] focus:outline-none"
        title="Lihat Promo Smartphone & Gadget Harga Butuh Uang"
      >
        {/* Banner Badge */}
        <div className="absolute top-2.5 left-3 sm:top-3 sm:left-4 z-20 flex items-center gap-1.5 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/85 backdrop-blur-md text-[10px] sm:text-xs font-black text-amber-300 border border-white/20 shadow-xs uppercase tracking-wider">
            <Flame className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
            Promo Spesial BU
          </span>
          <span className="hidden xs:inline-block px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[9px] font-extrabold text-slate-800 border border-slate-200 shadow-2xs">
            Diskon s/d 45%
          </span>
        </div>

        {/* Gambar Banner dengan Fallback Grafis Vektor jika Gambar Hilang */}
        {!imgError ? (
          <div className="relative w-full aspect-[3.2/1] sm:aspect-[3.8/1] md:aspect-[4.2/1] overflow-hidden bg-slate-900">
            <img
              src={triedFallback ? '/assets/aistudio/banner-hp-jualrugi.png' : '/banner-hp-jualrugi.png'}
              alt="Handphone Impresif, Harga Gila-Gilaan! - JualRugi.my.id"
              className="w-full h-full object-cover object-center group-hover:scale-[1.015] transition-transform duration-500 ease-out"
              onError={() => {
                if (!triedFallback) {
                  setTriedFallback(true);
                } else {
                  setImgError(true);
                }
              }}
            />
            {/* Floating CTA button on desktop/tablet */}
            <div className="absolute bottom-2.5 right-3 sm:bottom-3 sm:right-4 z-20 hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 hover:bg-black text-white text-[11px] sm:text-xs font-black shadow-lg backdrop-blur-sm border border-white/20 group-hover:border-amber-400 group-hover:text-amber-300 transition-all pointer-events-none">
              <span>Cari Smartphone Murah</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ) : (
          /* Fallback Grafis Vektor Responsif (Zero-Asset Failure) */
          <div className="relative w-full aspect-[3.2/1] sm:aspect-[3.8/1] md:aspect-[4.2/1] p-4 sm:p-6 flex flex-col justify-center text-white bg-gradient-to-r from-red-600 via-orange-600 to-amber-500">
            <div className="max-w-xl space-y-1 sm:space-y-1.5 pt-3 xs:pt-0">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-lg md:text-xl font-black text-white tracking-tight drop-shadow-sm">
                  BURSA SMARTPHONE & GADGET BUTUH UANG
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs md:text-sm text-amber-100 font-medium line-clamp-2">
                iPhone, Samsung Galaxy, Xiaomi diskon 20% - 45% di bawah harga pasaran normal. Wajib COD tatap muka!
              </p>
            </div>
            <div className="absolute bottom-2.5 right-3 sm:bottom-3 sm:right-4 hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 hover:bg-black text-white text-[11px] sm:text-xs font-black shadow-lg border border-white/20 group-hover:text-amber-300 transition-all pointer-events-none">
              <span>Lihat Promo Gadget</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Mobile Subtitle Tap Bar */}
        <div className="xs:hidden bg-gradient-to-r from-red-700 via-orange-600 to-amber-600 px-3 py-1.5 flex items-center justify-between text-white text-[10px] font-bold border-t border-white/20">
          <span className="flex items-center gap-1 truncate">
            <Tag className="w-3 h-3 text-amber-300 shrink-0" />
            <span>Diskon sadis HP & Gadget BU - 100% COD</span>
          </span>
          <span className="shrink-0 flex items-center gap-0.5 text-amber-200 font-extrabold">
            <span>Buka</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
