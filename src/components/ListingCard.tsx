import React from 'react';
import { MapPin, Flame, ShieldCheck, Clock, CheckCircle2, Lock } from 'lucide-react';
import { Listing } from '../types';

export const WhatsAppIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2M12.05 3.67C16.58 3.67 20.28 7.37 20.28 11.92C20.28 16.46 16.58 20.17 12.05 20.17C10.57 20.17 9.15 19.77 7.91 19.03L7.61 18.85L4.5 19.67L5.33 16.64L5.13 16.33C4.32 15.03 3.8 13.5 3.8 11.92C3.8 7.37 7.51 3.67 12.05 3.67M9.25 7.15C9.07 7.15 8.78 7.22 8.53 7.49C8.28 7.76 7.58 8.42 7.58 9.77C7.58 11.12 8.56 12.42 8.7 12.6C8.84 12.78 10.74 15.71 13.65 16.97C14.34 17.27 14.88 17.45 15.3 17.58C16 17.8 16.63 17.77 17.11 17.7C17.65 17.62 18.77 17.02 19.01 16.35C19.25 15.68 19.25 15.11 19.18 14.99C19.11 14.87 18.93 14.8 18.66 14.66C18.39 14.53 17.07 13.88 16.82 13.79C16.57 13.7 16.39 13.65 16.21 13.92C16.03 14.19 15.52 14.8 15.36 14.99C15.2 15.17 15.05 15.19 14.78 15.06C14.51 14.92 13.64 14.64 12.6 13.72C11.8 13.01 11.26 12.13 11.1 11.86C10.95 11.59 11.08 11.44 11.22 11.31C11.34 11.19 11.49 10.99 11.63 10.83C11.77 10.66 11.81 10.54 11.9 10.36C11.99 10.18 11.95 10.02 11.88 9.89C11.81 9.76 11.26 8.42 11.03 7.88C10.81 7.35 10.59 7.42 10.42 7.42C10.26 7.42 10.07 7.42 9.89 7.42C9.71 7.42 9.42 7.49 9.25 7.68V7.15Z" />
  </svg>
);

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  onQuickChat?: (e: React.MouseEvent) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onClick,
  onQuickChat,
}) => {
  const isSold = listing.status === 'sold';
  const isExpired =
    listing.status === 'expired' ||
    (!isSold && Date.now() - new Date(listing.createdAt).getTime() >= 30 * 24 * 60 * 60 * 1000);

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

  // =========================================================================
  // TOMBOL DIRECT CHAT WHATSAPP SELLER DENGAN FALLBACK NOMOR ADMIN 6289673686625
  // =========================================================================
  const FALLBACK_WA_ADMIN = '6289673686625';

  const rawSellerPhone =
    (listing as any).seller_phone ||
    (listing as any).sellerPhone ||
    (listing as any).whatsapp ||
    (listing.seller as any)?.whatsapp ||
    (listing.seller as any)?.phone ||
    '';

  let targetPhone = FALLBACK_WA_ADMIN;
  if (rawSellerPhone && !rawSellerPhone.includes('X') && !rawSellerPhone.includes('*')) {
    let clean = rawSellerPhone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    else if (clean.startsWith('8')) clean = '62' + clean;
    if (clean.length >= 9) targetPhone = clean;
  }

  const messageText = `Halo kak, saya tertarik dengan produk *${listing.title}*`;
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageText)}`;

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
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isSold ? 'grayscale-[40%] opacity-90' : isExpired ? 'grayscale opacity-75' : ''
          }`}
        />

        {/* Soft vignette for readable badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />

        {/* ======================================================== */}
        {/* WATERMARK LABEL KHUSUS PRODUK SOLD (3 IKLAN SEEDING/HARI) */}
        {/* ======================================================== */}
        {isSold && (
          <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-[1.5px] flex flex-col items-center justify-center p-3 text-center">
            <div className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl border-2 border-white flex items-center gap-1.5 rotate-[-3deg] animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>PRODUK SOLD</span>
            </div>
            <span className="text-[10px] text-white font-bold mt-1.5 drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full">
              Deal COD Sukses
            </span>
          </div>
        )}

        {/* WATERMARK IKLAN KEDALUWARSA (30 HARI) */}
        {isExpired && !isSold && (
          <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-[1.5px] flex flex-col items-center justify-center p-3 text-center">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-amber-300 font-black text-xs tracking-wider uppercase shadow-xl border border-amber-400/50 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>KEDALUWARSA (30 HARI)</span>
            </div>
            <span className="text-[10px] text-slate-200 font-bold mt-1.5 drop-shadow-md">
              Kuota +1 Dikembalikan
            </span>
          </div>
        )}

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

        {/* Produk Terverifikasi Badge */}
        {listing.aiVerified && (
          <div
            className="absolute top-2.5 right-2.5 z-10"
            title="Produk Terverifikasi: Foto Fisik Asli & Kondisi Teruji"
          >
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-600 text-white backdrop-blur-xs shadow-xs">
              <ShieldCheck className="w-3 h-3 text-sky-200" />
              Produk Terverifikasi
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

          {/* ========================================================================= */}
          {/* TOMBOL HIJAU: CHAT SELLER VIA WHATSAPP (MENGGANTIKAN CHAT AJUKAN COD)     */}
          {/* ========================================================================= */}
          {isSold ? (
            <button
              type="button"
              disabled
              onClick={(e) => e.stopPropagation()}
              className="mt-3 w-full py-2.5 px-2 rounded-xl text-xs font-black bg-slate-200 text-slate-500 border border-slate-300 flex items-center justify-center gap-1.5 cursor-not-allowed select-none shadow-none"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Barang Terjual / Chat Ditutup</span>
            </button>
          ) : isExpired ? (
            <button
              type="button"
              disabled
              onClick={(e) => e.stopPropagation()}
              className="mt-3 w-full py-2.5 px-2 rounded-xl text-xs font-black bg-slate-200 text-slate-500 border border-slate-300 flex items-center justify-center gap-1.5 cursor-not-allowed select-none shadow-none"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Iklan Tidak Aktif (30 Hari)</span>
            </button>
          ) : (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (onQuickChat) onQuickChat(e);
              }}
              className="mt-3 w-full py-2.5 px-2 rounded-xl text-xs font-black bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all text-center"
              title={`Chat Seller via WhatsApp untuk produk ${listing.title}`}
            >
              <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
              <span>Chat Seller via WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
