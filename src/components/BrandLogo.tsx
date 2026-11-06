import React, { useState } from 'react';
import { Flame } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * BrandLogo Component
 * Menyajikan logo resmi JualRugi.my.id secara tajam & responsif.
 * Dilengkapi proteksi failover otomatis:
 * 1. Mencoba memuat /logo_transparent.png (di root static)
 * 2. Mencoba memuat /assets/aistudio/logo_transparent.png
 * 3. Jika file gambar gagal/hilang, otomatis menampilkan SVG Logo vektor + styled typography
 *    sehingga tidak pernah ada broken image icon di layar pengguna/mobile browser.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showBadge = false,
  onClick,
  className = '',
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  const heightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9.5 md:h-10',
    lg: 'h-10 sm:h-12',
  }[size];

  const textSizeClasses = {
    sm: 'text-sm font-black',
    md: 'text-lg sm:text-xl font-black',
    lg: 'text-2xl font-black',
  }[size];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
      className={`inline-flex items-center gap-2 select-none ${
        onClick ? 'cursor-pointer focus:outline-none' : ''
      } ${className}`}
      title="JualRugi.my.id - Pusat Bursa Barang Bekas BU & Distress Sale"
    >
      {!imageFailed ? (
        <img
          src={triedFallback ? '/assets/aistudio/logo_transparent.png' : '/logo_transparent.png'}
          alt="JualRugi.my.id"
          className={`${heightClasses} w-auto object-contain select-none`}
          onError={() => {
            if (!triedFallback) {
              setTriedFallback(true);
            } else {
              setImageFailed(true);
            }
          }}
        />
      ) : (
        <div className="flex items-center gap-2">
          {/* Internal Branded SVG Icon */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-red-600 text-white shadow-xs">
              <Flame className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
            </span>
          </div>

          {/* Branded Typography */}
          <div className="flex items-baseline">
            <span className={`text-slate-900 tracking-tight ${textSizeClasses}`}>Jual</span>
            <span className={`text-sky-600 tracking-tight ${textSizeClasses}`}>Rugi</span>
            <span className="text-[10.5px] sm:text-xs font-bold text-slate-500 ml-0.5">.my.id</span>
          </div>
        </div>
      )}

      {showBadge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-sky-50 text-sky-700 border border-sky-200 font-extrabold uppercase tracking-wider hidden md:inline-block">
          Distress Sale
        </span>
      )}
    </div>
  );
};
