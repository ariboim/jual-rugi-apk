import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Rocket,
  CheckCircle2,
  UserCheck,
  Tag,
  X,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export type ActivityType =
  | 'prioritas_bu'
  | 'sundul'
  | 'closing_cepat'
  | 'listing_baru'
  | 'registrasi_seller';

export interface ActivityNotification {
  id: string;
  name: string;
  avatarText?: string;
  avatarBg?: string;
  type: ActivityType;
  title: string;
  highlightText: string;
  location?: string;
  timeAgo: string;
}

/**
 * ============================================================================
 * [BAGIAN ARRAY DATA DUMMY / MOCK DATA]
 * ============================================================================
 * Mudah diganti atau dihubungkan dengan API Database (Supabase, Firebase, Zapier).
 * Untuk backend real-time, cukup ganti array ini dengan data hasil fetch / Supabase subscription.
 */
export const DEFAULT_ACTIVITIES: ActivityNotification[] = [
  {
    id: 'act-1',
    name: 'Ardi Prasetyo',
    avatarText: 'AP',
    avatarBg: 'bg-amber-500',
    type: 'prioritas_bu',
    title: 'Membeli produk Laptop Asus ROG',
    highlightText: 'fitur Prioritas BU Banget 🔥',
    location: 'Jakarta Selatan',
    timeAgo: 'baru saja',
  },
  {
    id: 'act-2',
    name: 'Marlina Susanti',
    avatarText: 'MS',
    avatarBg: 'bg-sky-500',
    type: 'sundul',
    title: 'Membeli iPhone 13 128GB',
    highlightText: 'iklan Sundul Naik #1 🚀',
    location: 'Jakarta Barat',
    timeAgo: '1 menit yang lalu',
  },
  {
    id: 'act-3',
    name: 'Rian Kurniawan',
    avatarText: 'RK',
    avatarBg: 'bg-emerald-500',
    type: 'closing_cepat',
    title: 'Sukses menjual Motor Vario 160',
    highlightText: 'Closing dalam 2 jam via Sundul! ⚡',
    location: 'Bekasi',
    timeAgo: '2 menit yang lalu',
  },
  {
    id: 'act-4',
    name: 'Tria Rahmawati',
    avatarText: 'TR',
    avatarBg: 'bg-indigo-500',
    type: 'registrasi_seller',
    title: 'Registrasi sukses',
    highlightText: 'sebagai Penjual Terverifikasi COD 🛡️',
    location: 'Tangerang',
    timeAgo: '3 menit yang lalu',
  },
  {
    id: 'act-5',
    name: 'Budi Hartono',
    avatarText: 'BH',
    avatarBg: 'bg-teal-500',
    type: 'listing_baru',
    title: 'Memasang iklan baru iPad Pro M2',
    highlightText: 'Diskon 42% Butuh Uang Hari Ini',
    location: 'Bandung',
    timeAgo: '3 menit yang lalu',
  },
  {
    id: 'act-6',
    name: 'Dimas Anggara',
    avatarText: 'DA',
    avatarBg: 'bg-amber-600',
    type: 'prioritas_bu',
    title: 'Mengaktifkan Highlight Emas 24 Jam',
    highlightText: 'Iklan Kamera Sony A7 III',
    location: 'Surabaya',
    timeAgo: '4 menit yang lalu',
  },
  {
    id: 'act-7',
    name: 'Siti Nurhaliza',
    avatarText: 'SN',
    avatarBg: 'bg-emerald-600',
    type: 'closing_cepat',
    title: 'Laku Terjual Samsung S23 Ultra',
    highlightText: 'Nego deal langsung COD tatap muka',
    location: 'Depok',
    timeAgo: '5 menit yang lalu',
  },
];

interface LiveActivityTickerProps {
  customActivities?: ActivityNotification[];
  displayDuration?: number; // Durasi tayang dalam milidetik (default: 4500ms / 4.5 detik)
  intervalPause?: number;  // Jeda jeda sebelum ganti notifikasi (default: 1800ms / 1.8 detik)
  onDismiss?: () => void;
}

export const LiveActivityTicker: React.FC<LiveActivityTickerProps> = ({
  customActivities = DEFAULT_ACTIVITIES,
  displayDuration = 4500,
  intervalPause = 1800,
}) => {
  const [activities] = useState<ActivityNotification[]>(customActivities);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPermanentlyClosed, setIsPermanentlyClosed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Ref untuk mengontrol timing interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cek apakah user pernah menutup ticker pada sesi ini
    try {
      if (sessionStorage.getItem('jualrugi_hide_ticker') === 'true') {
        setIsPermanentlyClosed(true);
        return;
      }
    } catch (e) {
      console.error(e);
    }

    let isMounted = true;

    // Fungsi siklus: Muncul -> Diam (4.5s) -> Hilang -> Jeda (1.8s) -> Ganti berikutnya
    const runCycle = () => {
      if (!isMounted || isPermanentlyClosed) return;

      // 1. Munculkan notifikasi (Fade in / Slide up)
      setIsVisible(true);

      // 2. Tahan selama displayDuration (4.5 detik)
      timerRef.current = setTimeout(() => {
        if (!isMounted) return;

        // Jika user sedang hover/touch, jangan hilangkan dulu
        if (isPaused) {
          const waitHover = setInterval(() => {
            if (!isPaused) {
              clearInterval(waitHover);
              hideAndNext();
            }
          }, 500);
          return;
        }

        hideAndNext();
      }, displayDuration);
    };

    const hideAndNext = () => {
      // 3. Sembunyikan notifikasi (Fade out / Slide down)
      setIsVisible(false);

      // 4. Jeda istirahat (intervalPause: 1.8 detik) sebelum memunculkan notifikasi berikutnya
      timerRef.current = setTimeout(() => {
        if (!isMounted) return;
        setCurrentIndex((prev) => (prev + 1) % activities.length);
        runCycle();
      }, intervalPause);
    };

    // Delay awal 2.5 detik setelah website pertama kali dibuka
    const initialDelay = setTimeout(() => {
      runCycle();
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(initialDelay);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activities.length, displayDuration, intervalPause, isPaused, isPermanentlyClosed]);

  // Tombol Tutup (X)
  const handleClose = () => {
    setIsVisible(false);
    setIsPermanentlyClosed(true);
    try {
      sessionStorage.setItem('jualrugi_hide_ticker', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  if (isPermanentlyClosed || activities.length === 0) return null;

  const current = activities[currentIndex];

  // Helper Ikon & Warna sesuai tipe aktivitas
  const renderIconBadge = (type: ActivityType) => {
    switch (type) {
      case 'prioritas_bu':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />,
          badgeBg: 'bg-amber-100/90 text-amber-900 border-amber-300',
          badgeText: 'Prioritas BU',
        };
      case 'sundul':
        return {
          icon: <Rocket className="w-3.5 h-3.5 text-sky-600 fill-sky-500" />,
          badgeBg: 'bg-sky-100/90 text-sky-900 border-sky-300',
          badgeText: 'Sundul #1',
        };
      case 'closing_cepat':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />,
          badgeBg: 'bg-emerald-100/90 text-emerald-900 border-emerald-300',
          badgeText: 'Closing Deal',
        };
      case 'registrasi_seller':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-indigo-600" />,
          badgeBg: 'bg-indigo-100/90 text-indigo-900 border-indigo-300',
          badgeText: 'Seller Baru',
        };
      case 'listing_baru':
      default:
        return {
          icon: <Tag className="w-3.5 h-3.5 text-teal-600" />,
          badgeBg: 'bg-teal-100/90 text-teal-900 border-teal-300',
          badgeText: 'Iklan Baru',
        };
    }
  };

  const badgeConfig = renderIconBadge(current.type);

  return (
    <aside
      aria-live="polite"
      aria-label="Live Activity Ticker"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className={`fixed z-40 transition-all duration-500 ease-out 
        /* Mobile: Melayang pas di atas Bottom Navigation Bar (bottom-20) */
        bottom-20 left-3 right-3 sm:right-auto sm:left-5 sm:bottom-6 sm:max-w-sm w-auto
        ${
          isVisible
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }
      `}
    >
      <div className="relative rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-900/10 p-3 sm:p-3.5 text-slate-800 flex items-start gap-3 overflow-hidden group hover:border-sky-300 transition-colors">
        {/* Glow ambient background halus */}
        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-sky-200/30 rounded-full blur-xl pointer-events-none" />

        {/* Avatar Inisial Pengguna dengan Badge Visual */}
        <div className="relative shrink-0">
          <div
            className={`w-9 h-9 rounded-xl ${
              current.avatarBg || 'bg-sky-500'
            } text-white font-extrabold text-xs flex items-center justify-center shadow-xs select-none`}
          >
            {current.avatarText || current.name.charAt(0)}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-xs border border-slate-100">
            {badgeConfig.icon}
          </div>
        </div>

        {/* Konten Notifikasi */}
        <div className="grow min-w-0 pr-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs text-slate-900 truncate">
              {current.name}
            </span>
            <span
              className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded-md border ${badgeConfig.badgeBg}`}
            >
              {badgeConfig.badgeText}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
            <span>{current.title} </span>
            <strong className="text-sky-950 font-semibold underline decoration-sky-300/80">
              {current.highlightText}
            </strong>
          </p>

          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
            {current.location && (
              <span className="truncate text-slate-500 font-medium">
                📍 {current.location}
              </span>
            )}
            <span>•</span>
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {current.timeAgo}
            </span>
          </div>
        </div>

        {/* Tombol Tutup (X) Kecil */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          title="Tutup pemberitahuan ini"
          aria-label="Tutup notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Progress Bar Display Indicator (Berjalan selama 4.5s) */}
        <div
          className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-600 transition-all ${
            isVisible && !isPaused ? 'w-full' : 'w-0'
          }`}
          style={{
            transitionDuration: isVisible && !isPaused ? `${displayDuration}ms` : '0ms',
            transitionTimingFunction: 'linear',
          }}
        />
      </div>
    </aside>
  );
};
