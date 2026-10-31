import React from 'react';
import { MapPin, Flame, ShieldCheck, Clock } from 'lucide-react';
import { Listing } from '../types';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  onQuickChat: (e: React.MouseEvent) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onClick,
  onQuickChat,
}) => {
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${Math.floor(diffHours / 24)} hari lalu`;
  };

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden bg-white border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1 ${
        listing.isSuperBU
          ? 'border-sky-400 shadow-md shadow-sky-500/15 ring-2 ring-sky-300/60'
          : 'border-sky-100 hover:border-sky-300 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Super BU Priority Golden/Sky Ribbon */}
      {listing.isSuperBU && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-amber-500 via-sky-500 to-amber-500 px-3 py-1 flex items-center justify-between text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-white text-yellow-100 animate-pulse" />
            SUPER BU • BUTUH UANG HARI INI
          </span>
          <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded-sm">
            PRIORITAS COD
          </span>
        </div>
      )}

      {/* Thumbnail Container */}
      <div
        className={`relative w-full aspect-4/3 bg-sky-50/60 overflow-hidden ${
          listing.isSuperBU ? 'pt-6' : ''
        }`}
      >
        <img
          src={listing.imageUrl}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Soft vignette for readable badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />

        {/* Bright Red Badge: Diskon [X]% BU */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs sm:text-sm tracking-tight shadow-md">
            <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            Diskon {listing.discountPercentage}% BU
          </span>
        </div>

        {/* Category Tag on bottom left */}
        <div className="absolute bottom-2 left-2 z-10">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/95 text-sky-950 border border-sky-100 shadow-xs backdrop-blur-xs">
            {listing.category}
          </span>
        </div>

        {/* AI Verified Badge */}
        {listing.aiVerified && (
          <div
            className="absolute top-2.5 right-2.5 z-10"
            title="Lolos Verifikasi AI Multimodal: Foto Fisik Asli & Kriteria Jual Rugi Wajar"
          >
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white backdrop-blur-xs shadow-xs">
              <ShieldCheck className="w-3 h-3 text-sky-200" />
              AI Verified
            </span>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="p-3.5 flex flex-col justify-between grow bg-white">
        <div>
          {/* Title */}
          <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-sky-600 transition-colors">
            {listing.title}
          </h3>

          {/* Minus / Condition Snippet */}
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-normal italic">
            Minus: {listing.condition}
          </p>
        </div>

        {/* Pricing Section */}
        <div className="mt-3 pt-2.5 border-t border-sky-50">
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            {/* Urgent Price (Large Bold Text) */}
            <span className="text-base sm:text-lg font-black text-sky-900 tracking-tight">
              {formatRupiah(listing.sellingPrice)}
            </span>

            {/* Strike-through Normal Price */}
            <span className="text-xs text-slate-400 line-through font-medium">
              {formatRupiah(listing.normalPrice)}
            </span>
          </div>

          {/* Location & Time Tag */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span className="flex items-center gap-1 truncate max-w-[130px]">
              <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
              <span className="truncate font-medium text-slate-700">{listing.location}</span>
            </span>

            <span className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
              <Clock className="w-3 h-3 text-sky-400" />
              {getTimeAgo(listing.createdAt)}
            </span>
          </div>

          {/* Quick COD Chat Trigger - Sky Blue Button */}
          <button
            onClick={onQuickChat}
            className="mt-3 w-full py-2 px-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs shadow-sky-500/20"
          >
            <span>💬 Chat Ajukan COD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
