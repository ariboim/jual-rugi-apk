import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Flame,
  AlertTriangle,
  Clock,
  UserCheck,
  Share2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Check,
  Calendar,
  AlertCircle,
  Pencil,
  ArrowUp,
} from 'lucide-react';
import { Listing, UserProfile } from '../types';
import { getListingPhotos } from '../data/initialData';
import { ProductGallery } from './gallery/ProductGallery';
import { ListingStatsBar } from './ListingStatsBar';
import { getAdExpiryInfo, isListingOwner } from '../services/listingLifecycle';

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

interface ListingDetailModalProps {
  listing: Listing;
  onClose: () => void;
  onOpenChat: (listing: Listing) => void;
  onQuickMakeOffer: (listing: Listing, offerPrice: number) => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onIncrementView?: (listingId: string) => void;
  isSellerView?: boolean;
  currentUser?: UserProfile;
  onExtendListing?: (listing: Listing) => void;
  onMarkAsSold?: (listingId: string) => void;
  onEditListing?: (listing: Listing) => void;
  onUpgradeMayar?: (listing: Listing, type: 'sundul' | 'superbu') => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  onOpenChat,
  onQuickMakeOffer,
  isFavorited = false,
  onToggleFavorite,
  onIncrementView,
  isSellerView = false,
  currentUser,
  onExtendListing,
  onMarkAsSold,
  onEditListing,
  onUpgradeMayar,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Auto increment counter view saat halaman detail listing dibuka pengunjung
  useEffect(() => {
    const sessionKey = `viewed_listing_${listing.id}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      if (onIncrementView) {
        onIncrementView(listing.id);
      }
    }
  }, [listing.id, onIncrementView]);

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const savings = listing.normalPrice - listing.sellingPrice;

  const quickOffers = [
    Math.round((listing.sellingPrice * 0.95) / 50000) * 50000,
    Math.round((listing.sellingPrice * 0.9) / 50000) * 50000,
  ];

  // Compute status
  const isSold = listing.status === 'sold';
  const isExpired = listing.status === 'expired' || (!isSold && listing.createdAt && (Date.now() - new Date(listing.createdAt).getTime() >= 30 * 24 * 60 * 60 * 1000));
  const isInactive = isSold || isExpired;

  // Validasi Kepemilikan (Auth Check): HANYA seller/pemilik listing yang boleh melihat info tanggal kadaluarsa
  const isOwner = useMemo(() => {
    return isListingOwner(
      listing,
      currentUser?.id,
      currentUser?.email,
      isSellerView || currentUser?.role === 'seller'
    );
  }, [listing, currentUser, isSellerView]);

  // Kalkulasi detail tanggal kedaluwarsa iklan (Ad Expiry Date)
  const expiryInfo = useMemo(() => {
    return getAdExpiryInfo(listing);
  }, [listing]);

  // Mengambil array foto produk (hingga 6 foto) dengan format terintegrasi [{ id, url, caption }]
  const productPhotos = useMemo(() => getListingPhotos(listing), [listing]);

  // Construct URL deep link for this listing
  const getListingShareUrl = () => {
    try {
      const isCustomDomain =
        window.location.hostname === 'jualrugi.my.id' ||
        window.location.hostname.endsWith('jualrugi.my.id');
      const baseDomain = isCustomDomain
        ? window.location.origin
        : 'https://jualrugi.my.id';
      return `${baseDomain}/?deal=${encodeURIComponent(listing.id)}`;
    } catch {
      return `https://jualrugi.my.id/?deal=${encodeURIComponent(listing.id)}`;
    }
  };

  // WhatsApp Deep Link Handler: Prepopulates message with deal link, price, and urgent details
  const handleShareWhatsApp = () => {
    const shareUrl = getListingShareUrl();
    const discountText = listing.discountPercentage
      ? `(Diskon ${listing.discountPercentage}% dari pasaran normal ${formatRupiah(listing.normalPrice)})`
      : '';
    const urgentReasonText = listing.urgentReason
      ? `\n⚠️ *Alasan Butuh Uang (BU):* "${listing.urgentReason}"`
      : '';

    const lines = [
      `🔥 *INFO BARANG JUAL RUGI (BU) CEPAT!* 🔥`,
      ``,
      `*${listing.title}*`,
      `💰 *Harga BU:* ${formatRupiah(listing.sellingPrice)} ${discountText}`,
      `💸 *Hemat Bersih:* ${formatRupiah(savings)}`,
      urgentReasonText,
      `📍 *Lokasi COD:* ${listing.location}`,
      ``,
      `👉 *Cek foto fisik & nego langsung dengan penjual:*`,
      shareUrl,
      ``,
      `_Aman COD: Cek barang sepuasnya tanpa DP di jualrugi.my.id_`,
    ];

    const message = lines.filter(Boolean).join('\n');
    const waDeepLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waDeepLink, '_blank', 'noopener,noreferrer');
  };

  const handleGeneralShare = () => {
    const shareUrl = getListingShareUrl();
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Jual Rugi BU: ${listing.title} cuma ${formatRupiah(listing.sellingPrice)}!`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/40 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* WhatsApp Deep Link Share Button (Header) */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
              title="Bagikan deal ini ke WhatsApp (Deep Link)"
              aria-label="Share ke WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-[#25D366]" />
              <span className="hidden xs:inline text-[11px]">Share WA</span>
            </button>

            {/* Edit Iklan Button (Owner Only - Header Shortcut) */}
            {isOwner && onEditListing && (
              <button
                type="button"
                onClick={() => onEditListing(listing)}
                className="px-2.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black cursor-pointer transition-all flex items-center gap-1.5 text-xs shadow-xs active:scale-95"
                title="Edit rincian atau harga iklan ini"
              >
                <Pencil className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px]">Edit Iklan</span>
              </button>
            )}

            {/* General Share Button */}
            <button
              type="button"
              onClick={handleGeneralShare}
              className="p-2 rounded-full bg-sky-50 text-sky-800 hover:bg-sky-100 cursor-pointer transition-colors relative"
              title="Salin Tautan / Bagikan"
            >
              {copySuccess ? (
                <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in-75 duration-200" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-sky-50 text-sky-800 hover:bg-sky-100 cursor-pointer transition-colors"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto grow p-4 sm:p-6 space-y-4 bg-[#f0f9ff]/40">
          {/* Modul Galeri Produk & Fullscreen Lightbox Terintegrasi */}
          <ProductGallery
            photos={productPhotos}
            productTitle={listing.title}
            badgeOverlay={
              <div className="flex flex-wrap gap-2">
                {isSold && (
                  <span className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg flex items-center gap-1.5 border-2 border-white animate-pulse">
                    🔴 PRODUK SOLD
                  </span>
                )}
                {isExpired && (
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-700 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg flex items-center gap-1.5 border border-slate-500">
                    ⏳ KEDALUWARSA (30 HARI)
                  </span>
                )}
                {listing.isSuperBU && !isInactive && (
                  <span className="px-3 py-1 rounded-xl bg-amber-400 text-amber-950 font-black text-xs sm:text-sm tracking-tight shadow-md flex items-center gap-1.5 border border-amber-500 animate-pulse">
                    <Flame className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                    PALING BU
                  </span>
                )}
                <span className={`px-3 py-1 rounded-xl text-white font-black text-xs sm:text-sm tracking-tight shadow-md flex items-center gap-1.5 ${isSold ? 'bg-slate-700' : 'bg-red-600'}`}>
                  <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  DISKON {listing.discountPercentage}% BU
                </span>
                {listing.aiVerified && (
                  <span className="px-2.5 py-1 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-md flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-200" />
                    Produk Terverifikasi
                  </span>
                )}
              </div>
            }
          />

          {/* Banner Status Khusus: Terjual / Kedaluwarsa */}
          {isSold && (
            <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 flex items-start gap-3 shadow-xs">
              <div className="p-2 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-wider shrink-0">
                SOLD
              </div>
              <div className="text-xs">
                <h4 className="font-black text-red-900 text-sm">PRODUK INI TELAH TERJUAL</h4>
                <p className="text-red-800 mt-0.5 leading-relaxed">
                  Transaksi COD telah berhasil dituntaskan. Sesi tawar-menawar dan obrolan room chat resmi dikunci untuk mencegah penipuan.
                </p>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3 shadow-xs">
              <div className="p-2 rounded-xl bg-amber-600 text-white font-black text-xs uppercase tracking-wider shrink-0">
                EXPIRED
              </div>
              <div className="text-xs">
                <h4 className="font-black text-amber-950 text-sm">MASA TAYANG IKLAN BERAKHIR (30 HARI)</h4>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  Iklan ini telah melewati batas 30 hari tayang. Sistem telah menonaktifkan iklan & mengembalikan 1 kuota iklan aktif ke saldo pemilik. Room chat telah dikunci.
                </p>
              </div>
            </div>
          )}

          {/* Bar Statistik Iklan: Views & Favorites (2 Kolom Horizontal Rapi) */}
          <ListingStatsBar
            stats={{
              views_count: listing.views_count ?? listing.views ?? 0,
              favorites_count: listing.favorites_count ?? listing.savedCount ?? 0,
            }}
            isFavorited={isFavorited}
            onToggleFavorite={onToggleFavorite}
            isSellerView={isSellerView}
          />

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

          {/* ============================================================== */}
          {/* INFORMASI TANGGAL KADALUARSA (AD EXPIRY DATE) - KHUSUS SELLER  */}
          {/* Sesuai Mockup Gambar: Teks "YOUR AD EXPIRES ON DD/MM/YY"      */}
          {/* Validasi: HANYA muncul jika currentUser adalah pemilik iklan   */}
          {/* ============================================================== */}
          {isOwner && (
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                expiryInfo.isExpired
                  ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                  : expiryInfo.isUrgent
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                      expiryInfo.isExpired
                        ? 'bg-rose-100 text-rose-700'
                        : expiryInfo.isUrgent
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        Khusus Pemilik Iklan
                      </span>
                      {expiryInfo.isExpired ? (
                        <span className="text-xs font-black text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          IKLAN TELAH BERAKHIR / EXPIRED
                        </span>
                      ) : expiryInfo.isUrgent ? (
                        <span className="text-xs font-black text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Segera Berakhir ({expiryInfo.daysRemaining} hari lagi)
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Masa Tayang Aktif ({expiryInfo.daysRemaining} hari lagi)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Durasi standar 30 hari sejak dibuat ({new Date(listing.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
                    </p>
                  </div>
                </div>

                {/* Badge Teks Sesuai Mockup Gambar: YOUR AD EXPIRES ON DD/MM/YY */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/80">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 shadow-2xs text-center sm:text-right">
                    <span className="block text-xs font-mono font-black tracking-wider text-slate-900 uppercase">
                      {expiryInfo.formattedText}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium">
                      Tanggal: {expiryInfo.formattedLong}
                    </span>
                  </div>

                  {/* Tombol Upgrade Sundul / BU Prioritas via Mayar */}
                  {onUpgradeMayar && (
                    <button
                      type="button"
                      onClick={() => onUpgradeMayar(listing, 'sundul')}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                      title="Sundul atau Pasang BU Prioritas via Mayar"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      <span>Upgrade Mayar</span>
                    </button>
                  )}

                  {/* Tombol Perpanjang / Sundul jika expired atau ingin extend */}
                  {onExtendListing && (
                    <button
                      type="button"
                      onClick={() => onExtendListing(listing)}
                      className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                      title="Perpanjang masa aktif 30 hari lagi"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{expiryInfo.isExpired ? 'Aktifkan Kembali' : 'Perpanjang'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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

          {/* Verifikasi & Moderasi Produk Certificate */}
          <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-200 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <h4 className="font-bold text-sky-950">Hasil Verifikasi & Moderasi Produk</h4>
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
          {!isInactive ? (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                <span>⚡ Ajukan Nego Cepat (Langsung Chat):</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickOffers.map((offer, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onQuickMakeOffer(listing, offer)}
                    className="py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-semibold text-sky-950 transition text-center cursor-pointer active:scale-95 shadow-xs"
                  >
                    Tawar <strong className="text-sky-700">{formatRupiah(offer)}</strong>
                    <span className="block text-[10px] text-slate-500">Siap COD Hari Ini</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs text-center font-medium">
              🔒 Fitur penawaran harga cepat telah dinonaktifkan karena iklan ini berstatus{' '}
              <strong className="text-slate-900">{isSold ? 'SOLD (Terjual)' : 'Kedaluwarsa (30 Hari)'}</strong>.
            </div>
          )}

          {/* Dedicated WhatsApp Share BU Deal Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#25D366] text-white shadow-xs shrink-0 flex items-center justify-center">
                <WhatsAppIcon className="w-5 h-5 fill-white" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <span>Bagikan Penawaran BU Ini ke WhatsApp</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    Deep Link
                  </span>
                </div>
                <p className="text-emerald-800 mt-1 leading-relaxed text-[11px]">
                  Bantu teman dapat barang murah <strong className="text-emerald-950">{formatRupiah(listing.sellingPrice)}</strong> (hemat {formatRupiah(savings)}) atau share ke grup agar cepat laku!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0"
              title="Kirim info iklan ini via WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span>Share ke WhatsApp</span>
            </button>
          </div>

          {/* COD Safe Meeting Advisory */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              Protokol Aman COD JualRugi.my.id:
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              1. Cek fisik & tes fungsi menyeluruh sebelum bayar.<br />
              2. Temui penjual di tempat umum ramai (Indomaret/Mall/Kantor Polisi).<br />
              3. Bayar tunai / QRIS saat barang sudah di tangan Anda. Dilarang transfer DP!
            </p>
          </div>
        </div>

        {/* Sticky Action Footer - WhatsApp Share Deep Link & Chat Penjual */}
        <div className="p-3 sm:p-4 border-t border-sky-100 bg-white sticky bottom-0 z-20 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="py-3 px-3.5 sm:px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 transition-all shrink-0"
            title="Bagikan deal BU ini ke WhatsApp dengan link dan harga otomatis"
          >
            <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            <span className="hidden xs:inline">Share ke WhatsApp</span>
            <span className="xs:hidden">Share WA</span>
          </button>

          {isOwner ? (
            <div className="grow flex items-center gap-2">
              {onEditListing && (
                <button
                  type="button"
                  onClick={() => onEditListing(listing)}
                  className="py-3 px-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
                  title="Ubah rincian, harga BU, atau kondisi minus iklan ini"
                >
                  <Pencil className="w-4 h-4 text-white shrink-0" />
                  <span>Edit Iklan</span>
                </button>
              )}
              {onExtendListing && (
                <button
                  type="button"
                  onClick={() => onExtendListing(listing)}
                  className="grow py-3 px-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-sky-600/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all truncate"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{expiryInfo.isExpired ? 'Aktifkan Kembali Iklan' : 'Perpanjang Masa Tayang'}</span>
                </button>
              )}
              {onMarkAsSold && listing.status !== 'sold' && (
                <button
                  type="button"
                  onClick={() => onMarkAsSold(listing.id)}
                  className="py-3 px-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-700/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
                  title="Tandai produk telah laku terjual"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">Tandai Terjual</span>
                  <span className="xs:hidden">Sold</span>
                </button>
              )}
            </div>
          ) : isSold ? (
            <button
              type="button"
              disabled
              className="grow py-3 px-4 rounded-2xl bg-slate-200 text-slate-500 font-extrabold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2 shadow-none select-none border border-slate-300"
              title="Barang telah laku terjual, chat room telah ditutup"
            >
              <span>🔒 Barang Terjual / Chat Ditutup</span>
            </button>
          ) : isExpired ? (
            <button
              type="button"
              disabled
              className="grow py-3 px-4 rounded-2xl bg-slate-200 text-slate-500 font-extrabold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2 shadow-none select-none border border-slate-300"
              title="Iklan sudah kedaluwarsa 30 hari dan tidak aktif"
            >
              <span>🔒 Iklan Tidak Aktif / Dihapus</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenChat(listing)}
              className="grow py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all truncate"
            >
              <span>💬 Chat Penjual (COD)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
