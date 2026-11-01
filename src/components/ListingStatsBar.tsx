import React from 'react';
import { Eye, Heart } from 'lucide-react';

export interface ListingStats {
  views_count: number;
  favorites_count: number;
}

interface ListingStatsBarProps {
  stats: ListingStats;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  isSellerView?: boolean;
}

/**
 * Komponen Bar Statistik Iklan (Views & Favorites)
 * Diletakkan tepat di bawah banner/carousel galeri produk.
 * 
 * Sisi Kiri: Ikon mata + jumlah tayangan (views)
 * Sisi Kanan: Ikon hati + jumlah difavoritkan (dengan fungsi toggle favorit)
 */
export const ListingStatsBar: React.FC<ListingStatsBarProps> = ({
  stats,
  isFavorited = false,
  onToggleFavorite,
  isSellerView = false,
}) => {
  return (
    <div className="w-full bg-white rounded-2xl px-4 py-3 border border-sky-100 shadow-xs flex items-center justify-between transition-all">
      {/* Sisi Kiri: Counter Dilihat (Views) */}
      <div className="flex items-center gap-2.5 text-slate-700">
        <div className="p-1.5 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <Eye className="w-4 h-4 text-sky-600 stroke-[2.2]" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            {stats.views_count.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {stats.views_count === 1 ? 'dilihat' : 'kali dilihat'}
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Counter Favorit (Favorites) */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={!onToggleFavorite}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
            onToggleFavorite
              ? 'cursor-pointer active:scale-95 hover:bg-rose-50/80'
              : 'cursor-default'
          } ${
            isFavorited
              ? 'text-rose-600 font-bold bg-rose-50/60'
              : 'text-slate-700 hover:text-rose-600'
          }`}
          title={
            onToggleFavorite
              ? isFavorited
                ? 'Hapus dari favorit'
                : 'Simpan ke favorit'
              : 'Total difavoritkan pengunjung'
          }
        >
          <div
            className={`p-1.5 rounded-xl transition-colors flex items-center justify-center shrink-0 ${
              isFavorited
                ? 'bg-rose-100 text-rose-600'
                : 'bg-rose-50 text-rose-500'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isFavorited
                  ? 'fill-rose-500 text-rose-500 scale-110'
                  : 'stroke-[2.2]'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-sm sm:text-base font-extrabold tracking-tight ${
                isFavorited ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {stats.favorites_count.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              favorit
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
