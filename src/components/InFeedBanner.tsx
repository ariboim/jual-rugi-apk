import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Sparkles, Tag, ExternalLink } from 'lucide-react';

interface InFeedBannerProps {
  /**
   * Callback saat banner diklik.
   * Di dalam SPA jualrugi.id, ini langsung memfilter feed ke kategori Handphone/Smartphone.
   */
  onClick?: () => void;
  /**
   * Path gambar banner. Default: '/assets/aistudio/banner-hp-jualrugi.png'
   */
  imageUrl?: string;
  /**
   * URL target tujuan (misal: /kategori/smartphone atau /search?category=smartphone)
   */
  targetUrl?: string;
  /**
   * Callback event impression tracking (Intersection Observer)
   */
  onImpression?: (bannerId: string) => void;
  /**
   * Callback event click tracking
   */
  onClickTrack?: (bannerId: string, targetUrl: string) => void;
  /**
   * Label tag promosi (misal: 'PROMO UNGGULAN' atau 'REKOMENDASI COD')
   */
  badgeText?: string;
  /**
   * Custom CSS class name
   */
  className?: string;
}

/**
 * Komponen Banner Iklan In-Feed Horizontal (Pola Layout Feed OLX)
 * 
 * Karakteristik:
 * 1. Full-width horizontal (col-span-full pada grid katalog)
 * 2. Rasio aspek proporsional responsif (~3:1 pada desktop, responsif rapi di smartphone)
 * 3. Sudut rounded-2xl & soft shadow menyatu dengan feed produk
 * 4. Tracking Impression otomatis dengan IntersectionObserver (saat 50% terlihat di viewport)
 * 5. Event Click Tracking & SPA navigation handling
 */
export const InFeedBanner: React.FC<InFeedBannerProps> = ({
  onClick,
  imageUrl = '/assets/aistudio/banner-hp-jualrugi.png',
  targetUrl = '/search?category=smartphone',
  onImpression,
  onClickTrack,
  badgeText = 'Pusatnya HP Butuh Uang',
  className = '',
}) => {
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const [hasImpressionFired, setHasImpressionFired] = useState(false);

  // Intersection Observer untuk Impression Tracking (terdeteksi saat banner masuk layar)
  useEffect(() => {
    if (!bannerRef.current || hasImpressionFired) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasImpressionFired) {
            setHasImpressionFired(true);
            const bannerId = 'infeed-banner-smartphone-clearance';
            
            // Console logging analytics impression
            console.log('[Analytics Impression] Banner in-feed terlihat di viewport:', {
              bannerId,
              timestamp: new Date().toISOString(),
              intersectionRatio: entry.intersectionRatio.toFixed(2),
            });

            if (onImpression) {
              onImpression(bannerId);
            }

            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.4, // Terpicu ketika minimal 40% area banner terlihat
      }
    );

    observer.observe(bannerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasImpressionFired, onImpression]);

  const handleBannerClick = (e: React.MouseEvent) => {
    // Analytics click logging
    const bannerId = 'infeed-banner-smartphone-clearance';
    console.log('[Analytics Click] Banner in-feed diklik pengguna:', {
      bannerId,
      targetUrl,
      timestamp: new Date().toISOString(),
    });

    if (onClickTrack) {
      onClickTrack(bannerId, targetUrl);
    }

    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      ref={bannerRef}
      className={`col-span-full w-full my-2 sm:my-3 select-none transition-all duration-300 ${className}`}
      data-ad-slot="in-feed-horizontal-banner"
    >
      <div
        onClick={handleBannerClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleBannerClick(e as unknown as React.MouseEvent);
          }
        }}
        className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 shadow-md hover:shadow-xl border border-red-200/60 transition-all duration-300 cursor-pointer block active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        {/* Subtle decorative badges like OLX ("Ads by jualrugi" or sponsor tag) */}
        <div className="absolute top-2.5 left-3 sm:top-3 sm:left-4 z-20 flex items-center gap-1.5 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] sm:text-xs font-black text-amber-300 border border-white/20 shadow-xs uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
            {badgeText}
          </span>
          <span className="hidden xs:inline-block px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-md text-[9px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
            Iklan Unggulan
          </span>
        </div>

        {/* Responsive Horizontal Banner Image (3:1 aspect ratio friendly) */}
        <div className="relative w-full aspect-[3.2/1] sm:aspect-[3.6/1] md:aspect-[3.8/1] overflow-hidden bg-orange-600">
          <img
            src={imageUrl}
            alt="Handphone Impresif, Harga Gila-Gilaan! - JualRugi.id"
            className="w-full h-full object-cover object-center group-hover:scale-[1.015] transition-transform duration-500 ease-out"
            loading="lazy"
            onError={(e) => {
              // Fallback jika path utama bermasalah
              const target = e.target as HTMLImageElement;
              if (target.src.indexOf('1793503560650_005d3f1c.jpg') === -1) {
                target.src = '/assets/aistudio/1793503560650_005d3f1c.jpg';
              }
            }}
          />

          {/* Interactive Floating Hover CTA for Desktop/Tablet */}
          <div className="absolute bottom-2.5 right-3 sm:bottom-3 sm:right-4 z-20 hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 hover:bg-black text-white text-[11px] sm:text-xs font-black shadow-lg backdrop-blur-sm border border-white/20 group-hover:border-amber-400 group-hover:text-amber-300 transition-all duration-300 pointer-events-none">
            <span>Cari Smartphone Murah</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Mobile Subtitle Tap Area Info */}
        <div className="xs:hidden bg-gradient-to-r from-red-700 via-orange-600 to-amber-600 px-3 py-1.5 flex items-center justify-between text-white text-[10px] font-bold border-t border-white/20">
          <span className="flex items-center gap-1 truncate">
            <Tag className="w-3 h-3 text-amber-300 shrink-0" />
            <span>Diskon sadis smartphone & gadget BU</span>
          </span>
          <span className="shrink-0 flex items-center gap-0.5 text-amber-200">
            <span>Lihat</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
