import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * BrandLogo Component
 * Menyajikan identitas visual resmi JualRugi.my.id dalam bentuk vektor inline SVG murni & tipografi presisi.
 * Keunggulan utama:
 * 1. 100% Bebas dari risiko broken image icon ([x] icon) karena tidak bergantung pada request file eksternal/PNG.
 * 2. Tampil tajam (ultra-crisp) di semua resolusi layar (Retina, OLED smartphone, desktop 4K).
 * 3. Ringan, 0 ms loading time, dan bekerja mulus saat offline (PWA) maupun saat di-deploy ke Cloudflare/GitHub.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showBadge = false,
  onClick,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
  }[size];

  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
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
      {/* Official Vector Shopping Cart + Flame Icon (100% Zero-Failure, Instant Render, No Broken Image Ever) */}
      <div className={`relative ${iconSizes} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            <linearGradient id="jrCartGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ef4444" />
              <stop offset="0.5" stopColor="#f97316" />
              <stop offset="1" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="jrFlameGrad" x1="22" y1="8" x2="32" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde047" />
              <stop offset="0.6" stopColor="#f97316" />
              <stop offset="1" stopColor="#dc2626" />
            </linearGradient>
          </defs>

          {/* Cart handle & basket lines */}
          <path
            d="M6 10h6l4.6 19.5a3 3 0 0 0 2.9 2.3h18.8a3 3 0 0 0 2.9-2.2L44 16H14.5"
            stroke="url(#jrCartGrad)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cart wheels */}
          <circle cx="20" cy="38" r="3.2" fill="#ef4444" />
          <circle cx="34" cy="38" r="3.2" fill="#ea580c" />

          {/* Distress flame symbol rising from basket */}
          <path
            d="M26 12.5c.6 2.3 2.2 3.3 3.1 4.7 1.4 2.1.8 4.3-.7 5.2-1.5 1-3.4.5-4-.9-.2-.5-.2-1.1.2-1.7-1.4.9-2.1 2.5-1.7 4 .5 2.1 2.5 3.4 4.6 3.1 2.4-.3 4.1-2.3 3.8-4.8-.2-1.7-1.4-3-2.4-4.3-.8-1-1.1-2.1-1-3.5-.7.6-1.3 1.6-1.9 3.2Z"
            fill="url(#jrFlameGrad)"
          />
        </svg>
      </div>

      {/* Typography: jual (black) + rugi (red) + .my.id (gray) */}
      <div className="flex items-baseline leading-none">
        <span className={`font-black text-slate-900 tracking-tight ${textSizes}`}>jual</span>
        <span className={`font-black text-red-600 tracking-tight ${textSizes}`}>rugi</span>
        <span className="text-[10px] sm:text-[11.5px] font-bold text-slate-500 tracking-tight ml-0.5">
          .my.id
        </span>
      </div>

      {showBadge && (
        <span className="text-[9.5px] px-1.5 py-0.5 rounded-sm bg-red-50 text-red-700 border border-red-200 font-extrabold uppercase tracking-wider hidden md:inline-block">
          Distress Sale
        </span>
      )}
    </div>
  );
};
