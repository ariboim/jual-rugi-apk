import React, { useState } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * BrandLogo Component
 * Menampilkan identitas visual resmi JualRugi.my.id:
 * 1. Logo icon kantong belanja kuning dengan gagang merah & panah diskon merah tajam (distress sale BU).
 * 2. 100% Bersih, transparan, tanpa frame / border kotak.
 * 3. Menghindari broken image icon dengan fallback elegan ke SVG resmi.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showBadge = false,
  onClick,
  className = '',
}) => {
  const [imageFailed, setImageFailed] = useState(false);

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
      {/* Official Clean Transparent Brand Icon without frame or border */}
      <div className={`relative ${iconSizes} shrink-0 flex items-center justify-center`}>
        {!imageFailed ? (
          <img
            src="/logo_icon.png"
            alt="Logo JualRugi.my.id"
            className="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-200"
            loading="eager"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          /* High-Fidelity SVG Fallback matching the official artwork */
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-contain"
          >
            {/* Bag Handle (Red) */}
            <path
              d="M45 28 C45 14, 65 14, 65 28 L65 32 L45 32 Z"
              stroke="#e52328"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Shopping Bag (Yellow/Gold) */}
            <polygon
              points="34,22 86,22 80,68 37,56"
              fill="#f7a81b"
            />
            {/* Handle holes */}
            <circle cx="48" cy="27" r="3.5" fill="#ffffff" />
            <circle cx="68" cy="27" r="3.5" fill="#ffffff" />
            {/* Red plunging arrow */}
            <path
              d="M10 32 L20 32 L36 68 L60 48 L80 82"
              stroke="#ffffff"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M10 32 L20 32 L36 68 L60 48 L80 82"
              stroke="#e52328"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Arrowhead */}
            <polygon points="76,86 94,84 84,72" fill="#e52328" />
            {/* Red dot */}
            <circle cx="43" cy="74" r="5" fill="#e52328" />
          </svg>
        )}
      </div>

      {/* Typography: jual (deep navy #0e1b38) + rugi (vibrant red #ee1c25) + .my.id (navy) */}
      <div className="flex items-baseline leading-none">
        <span className={`font-black text-[#0e1b38] tracking-tight ${textSizes}`}>jual</span>
        <span className={`font-black text-[#ee1c25] tracking-tight ${textSizes}`}>rugi</span>
        <span className="text-[10px] sm:text-[11.5px] font-bold text-[#0e1b38]/75 tracking-tight ml-0.5">
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
