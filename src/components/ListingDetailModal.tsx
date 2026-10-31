import React from 'react';
import {
  X,
  MapPin,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Clock,
  UserCheck,
  Share2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Listing } from '../types';

interface ListingDetailModalProps {
  listing: Listing;
  onClose: () => void;
  onOpenChat: (listing: Listing) => void;
  onQuickMakeOffer: (listing: Listing, offerPrice: number) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  onOpenChat,
  onQuickMakeOffer,
}) => {
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const savings = listing.normalPrice - listing.sellingPrice;

  const quickOffers = [
    Math.round((listing.sellingPrice * 0.95) / 50000) * 50000,
    Math.round((listing.sellingPrice * 0.9) / 50000) * 50000,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/35 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-800">
        {/* Sticky Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sky-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {listing.category}
            </span>
            {listing.isSuperBU && (
              <span className="flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-300 text-amber-950 border border-amber-400 shadow-xs animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-red-600 text-red-600" /> PALING BU
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: listing.title,
                    text: `Jual Rugi BU: ${listing.title} cuma ${formatRupiah(listing.sellingPrice)}!`,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Tautan iklan berhasil disalin!');
                }
              }}
              className="p-2 rounded-full bg-sky-50 text-sky-800 hover:bg-sky-100 cursor-pointer"
              title="Bagikan Iklan"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-sky-50 text-sky-800 hover:bg-sky-100 cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto grow p-4 sm:p-6 space-y-5 bg-[#f0f9ff]/50">
          {/* Main Photo with urgent overlay */}
          <div className="relative rounded-2xl overflow-hidden aspect-16/10 bg-sky-50 border border-sky-100">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            {/* Distress Sale Ribbon */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {listing.isSuperBU && (
                <span className="px-3 py-1.5 rounded-xl bg-amber-400 text-amber-950 font-black text-sm tracking-tight shadow-md flex items-center gap-1.5 border border-amber-500 animate-pulse">
                  <Flame className="w-4 h-4 fill-red-600 text-red-600" />
                  PALING BU
                </span>
              )}
              <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-black text-sm tracking-tight shadow-md flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-amber-300 text-amber-300" />
                DISKON {listing.discountPercentage}% BU
              </span>
            </div>

            {listing.aiVerified && (
              <div className="absolute bottom-3 right-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-600 text-white text-xs font-bold shadow-md">
                  <ShieldCheck className="w-4 h-4 text-sky-200" />
                  Foto Fisik Terverifikasi AI
                </span>
              </div>
            )}
          </div>

          {/* Pricing Box */}
          <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs space-y-2">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs text-slate-500 font-medium">Harga Jual Cepat (BU):</p>
                <div className="text-2xl sm:text-3xl font-black text-sky-950 tracking-tight">
                  {formatRupiah(listing.sellingPrice)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Harga Pasaran Normal:</p>
                <div className="text-base text-slate-400 line-through font-semibold">
                  {formatRupiah(listing.normalPrice)}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-sky-50 flex items-center justify-between text-xs text-sky-800 font-semibold">
              <span>Hemat sebesar: {formatRupiah(savings)}</span>
              <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md font-bold">
                Wajib COD (Tanpa DP)
              </span>
            </div>
          </div>

          {/* Title & Basic Specs */}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {listing.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                {listing.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Tayang {new Date(listing.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Reason for Urgent Distress Sale ("Alasan BU") */}
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Flame className="w-4 h-4 fill-red-600 text-red-600 animate-pulse" />
              Alasan Jual Rugi / Butuh Uang (BU):
            </div>
            <p className="text-sm text-red-950 font-medium leading-relaxed">
              "{listing.urgentReason}"
            </p>
          </div>

          {/* Condition & Minus checklist */}
          <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Kejujuran Kondisi & Minus Fisik:
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-sky-50/50 p-3 rounded-xl border border-sky-100">
              {listing.condition}
            </p>
          </div>

          {/* AI Audit Gatekeeper Certificate */}
          <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-200 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <h4 className="font-bold text-sky-950">Hasil Audit Gatekeeper AI Gemini</h4>
              <p className="text-sky-800 mt-0.5 leading-relaxed font-medium">
                {listing.aiVerificationReason}
              </p>
            </div>
          </div>

          {/* Seller Profile Card */}
          <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={listing.seller.avatar}
                alt={listing.seller.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-sky-200"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-slate-900">{listing.seller.name}</h4>
                  {listing.seller.codVerified && (
                    <span
                      title="Seller Terverifikasi COD"
                      className="text-sky-600 inline-flex items-center"
                    >
                      <UserCheck className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                  <span className="text-amber-600 font-bold">★ {listing.seller.rating}</span>
                  <span>•</span>
                  <span>{listing.seller.dealsCompleted} Transaksi COD Sukses</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Bergabung sejak {listing.seller.joinedDate} • Lokasi {listing.seller.location}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Sadis Offer Simulation Buttons */}
          <div className="space-y-1.5">
            <p className="text-xs text-slate-600 font-semibold flex items-center gap-1">
              <span>⚡ Ajukan Nego Cepat (Langsung Chat):</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickOffers.map((offer, idx) => (
                <button
                  key={idx}
                  onClick={() => onQuickMakeOffer(listing, offer)}
                  className="py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-semibold text-sky-950 transition text-center cursor-pointer active:scale-95 shadow-xs"
                >
                  Tawar <strong className="text-sky-700">{formatRupiah(offer)}</strong>
                  <span className="block text-[10px] text-slate-500">Siap COD Hari Ini</span>
                </button>
              ))}
            </div>
          </div>

          {/* COD Safe Meeting Advisory */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              Protokol Aman COD JualRugi.id:
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              1. Cek fisik & tes fungsi menyeluruh sebelum bayar.<br />
              2. Temui penjual di tempat umum ramai (Indomaret/Mall/Kantor Polisi).<br />
              3. Bayar tunai / QRIS saat barang sudah di tangan Anda. Dilarang transfer DP!
            </p>
          </div>
        </div>

        {/* Sticky Action Footer - Sky Blue CTA */}
        <div className="p-4 border-t border-sky-100 bg-white sticky bottom-0 z-20 flex items-center gap-3">
          <button
            onClick={() => onOpenChat(listing)}
            className="grow py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-sm shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
          >
            <span>💬 Chat Langsung dengan Penjual (COD)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
