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
      className={`group relative rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1 ${
        listing.isSuperBU
          ? 'bg-amber-100/90 border-2 border-amber-400 shadow-xl shadow-amber-500/20 ring-4 ring-amber-300/80'
          : 'bg-white border border-sky-100 hover:border-sky-300 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Paling BU Top Golden Ribbon */}
      {listing.isSuperBU && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-3 py-1.5 flex items-center justify-between text-amber-950 text-[11px] font-black tracking-wider uppercase shadow-sm border-b border-amber-300">
          <span className="flex items-center gap-1.5 font-black">
            <Flame className="w-4 h-4 fill-red-600 text-red-600 animate-pulse" />
            PALING BU • BUTUH UANG HARI INI
          </span>
          <span className="text-[9px] font-black bg-amber-950 text-amber-100 px-2 py-0.5 rounded-sm tracking-widest">
            PRIORITAS #1 COD
          </span>
        </div>
      )}

      {/* Thumbnail Container */}
      <div
        className={`relative w-full aspect-4/3 overflow-hidden ${
          listing.isSuperBU ? 'pt-7 bg-amber-100/70' : 'bg-sky-50/60'
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

        {/* Badges on Top Left: PALING BU & Diskon BU */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
          {listing.isSuperBU && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-amber-950 font-black text-xs sm:text-sm tracking-tight shadow-md border border-amber-500 animate-pulse">
              <Flame className="w-4 h-4 fill-red-600 text-red-600" />
              PALING BU
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs sm:text-sm tracking-tight shadow-md">
            <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            Diskon {listing.discountPercentage}% BU
          </span>
        </div>

        {/* Category Tag on bottom left & Multi-angle photo count on bottom right */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs ${
            listing.isSuperBU
              ? 'bg-amber-300 text-amber-950 border border-amber-400 font-black'
              : 'bg-white/95 text-sky-950 border border-sky-100'
          }`}>
            {listing.category}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs bg-sky-950/75 text-white flex items-center gap-1 border border-white/20">
            <span>📸 4 Sudut</span>
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

      {/* Card Details: Yellow highlight when Paling BU */}
      <div className={`p-3.5 flex flex-col justify-between grow transition-colors ${
        listing.isSuperBU
          ? 'bg-amber-50/95 border-t border-amber-200'
          : 'bg-white'
      }`}>
        <div>
          {/* Label indicator for Paling BU */}
          {listing.isSuperBU && (
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black border border-amber-400">
                <Flame className="w-3 h-3 fill-red-600 text-red-600" /> PALING BU
              </span>
              <span className="text-[10px] text-amber-800 font-bold">Diskon Ekstrim BU Mendesak</span>
            </div>
          )}

          {/* Title */}
          <h3 className={`text-sm font-bold line-clamp-2 leading-snug transition-colors ${
            listing.isSuperBU
              ? 'text-amber-950 font-extrabold group-hover:text-amber-700'
              : 'text-slate-900 group-hover:text-sky-600'
          }`}>
            {listing.title}
          </h3>

          {/* Minus / Condition Snippet */}
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-normal italic">
            Minus: {listing.condition}
          </p>
        </div>

        {/* Pricing Section */}
        <div className={`mt-3 pt-2.5 ${listing.isSuperBU ? 'border-t border-amber-200' : 'border-t border-sky-50'}`}>
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            {/* Urgent Price */}
            <span className={`text-base sm:text-lg font-black tracking-tight ${
              listing.isSuperBU ? 'text-amber-950' : 'text-sky-900'
            }`}>
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
              <MapPin className={`w-3 h-3 shrink-0 ${listing.isSuperBU ? 'text-amber-600' : 'text-sky-500'}`} />
              <span className="truncate font-medium text-slate-700">{listing.location}</span>
            </span>

            <span className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
              <Clock className={`w-3 h-3 ${listing.isSuperBU ? 'text-amber-500' : 'text-sky-400'}`} />
              {getTimeAgo(listing.createdAt)}
            </span>
          </div>

          {/* Quick COD Chat Trigger Button */}
          <button
            onClick={onQuickChat}
            className={`mt-3 w-full py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs ${
              listing.isSuperBU
                ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 border border-amber-500 shadow-amber-500/25 font-black'
                : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20'
            }`}
          >
            <span>💬 Chat Ajukan COD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
