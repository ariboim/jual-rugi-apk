import React from 'react';
import {
  Flame,
  ArrowUp,
  Eye,
  Heart,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  PlusCircle,
  Clock,
  UserCheck,
  Smartphone,
  Download,
  LogOut,
  LogIn,
  Database,
  FileText,
  Calendar,
  Pencil,
  Zap,
} from 'lucide-react';
import { Listing, UserProfile } from '../types';
import { MonetizationType } from './QRISModal';
import { APK_DOWNLOAD_URL } from './PWAInstallButton';
import { isSupabaseConfigured } from '../services/supabase';
import { getAdExpiryInfo } from '../services/listingLifecycle';
import type { AdminTestPreset } from '../data/adminTestPresets';

interface SellerDashboardProps {
  currentUser: UserProfile;
  listings: Listing[];
  onOpenNewListing: () => void;
  onOpenQRIS: (listing: Listing, type: MonetizationType) => void;
  onDeleteListing: (listingId: string) => void;
  onOpenListingDetail: (listing: Listing) => void;
  onOpenSafetyGuide: () => void;
  isLoggedIn?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onOpenSupabaseSettings?: () => void;
  onOpenPanduanModal?: () => void;
  onOpenWelcomeEmailSetup?: () => void;
  onEditListing?: (listing: Listing) => void;
  onQuickTestAd?: (presetIndex?: number) => void;
  onPrefillTestAd?: (preset: AdminTestPreset) => void;
  onOpenAdmin?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentUser,
  listings,
  onOpenNewListing,
  onOpenQRIS,
  onDeleteListing,
  onOpenListingDetail,
  onOpenSafetyGuide,
  isLoggedIn = false,
  onLogin,
  onLogout,
  onOpenSupabaseSettings,
  onOpenPanduanModal,
  onOpenWelcomeEmailSetup,
  onEditListing,
  onQuickTestAd,
  onPrefillTestAd,
  onOpenAdmin,
}) => {
  const hasActiveAccount = isLoggedIn && currentUser.id !== 'guest';

  const myListings = React.useMemo(() => {
    return listings
      .filter(
        (l) =>
          l.user_id === currentUser.id ||
          l.seller.id === currentUser.id ||
          l.seller.id === 'seller-agus' ||
          l.seller.id === 'admin-main' ||
          l.seller.name.toLowerCase().includes('admin') ||
          (l as any).seller_email === 'bca.ccpl@gmail.com'
      )
      .sort((a, b) => {
        const aSundul = a.sundulAt ? new Date(a.sundulAt).getTime() : 0;
        const bSundul = b.sundulAt ? new Date(b.sundulAt).getTime() : 0;
        if (aSundul !== bSundul) return bSundul - aSundul;
        if (a.isSuperBU && !b.isSuperBU) return -1;
        if (!a.isSuperBU && b.isSuperBU) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [listings, currentUser.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5 pb-24 text-slate-800">
      {/* Profile Card & Seller Badges */}
      <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-400 shadow-sm"
            />
            <span
              className="absolute -bottom-1 -right-1 p-1 bg-sky-500 rounded-full text-white"
              title="Terverifikasi COD"
            >
              <UserCheck className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-lg font-black text-sky-950">{currentUser.name}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Seller Terverifikasi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
              <span className="font-bold text-amber-600">★ 4.9 Rating COD</span>
              <span>•</span>
              <span>14 Transaksi Berhasil</span>
              <span>•</span>
              <span>{currentUser.city}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Pasang Iklan + Admin + Logout / Login */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition"
            >
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Dashboard Admin</span>
            </button>
          )}

          <button
            onClick={onOpenNewListing}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-500/20 cursor-pointer active:scale-95 transition"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Pasang Iklan Baru</span>
          </button>

          {hasActiveAccount ? (
            onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Keluar dari akun Anda"
                className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Keluar</span>
              </button>
            )
          ) : (
            onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-600" />
                <span>Masuk Akun</span>
              </button>
            )
          )}
        </div>
      </div>


      {/* Banner Unduh Aplikasi Android APK Langsung */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h3 className="font-black text-sm text-white">Aplikasi Resmi JualRugi.my.id</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black">
                Update Otomatis
              </span>
            </div>
            <p className="text-xs text-sky-100 mt-0.5">
              Pasang langsung di HP Anda melalui menu browser (Install Aplikasi) agar selalu sinkron dan tampilan 100% normal.
            </p>
          </div>
        </div>
        <a
          href={APK_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-white hover:bg-sky-50 text-sky-900 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4 text-sky-600 animate-bounce" />
          <span>Download File APK</span>
        </a>
      </div>

      {/* Quota & Monetization Tracker Card */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-amber-50/60 p-4 rounded-3xl border border-sky-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
            {currentUser.listingQuota}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-sky-950">
                Sisa Kuota Posting: {currentUser.listingQuota} Slot
              </h4>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  currentUser.listingQuota > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {currentUser.listingQuota > 0 ? 'Siap Pasang Iklan' : 'Kuota Habis'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {!currentUser.freeListingUsed
                ? '🎁 Termasuk 1x Kuota Iklan Gratis untuk pendaftar baru.'
                : 'Beli Sundul Iklan atau Prioritas BU Banget untuk membuka +1 slot iklan baru.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={onOpenNewListing}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-xs cursor-pointer transition"
          >
            + Pasang Iklan
          </button>
        </div>
      </div>

      {/* Monetization Feature Callout Banner with Mayar Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-sky-100 p-4 rounded-2xl shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0">
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-sky-950">Sundul Iklan</h4>
              <span className="text-xs font-black bg-sky-100 text-sky-900 px-2 py-0.5 rounded-md">
                Rp 25.000
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                +1 Slot Kuota
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Pindahkan posisi iklan langsung ke urutan #1 teratas di feed secara instan + bonus otomatis 1 kuota posting iklan baru via Mayar.id.
            </p>
          </div>
        </div>

        <div className="bg-white border border-amber-300 p-4 rounded-2xl shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-sky-950">Prioritas BU Banget</h4>
              <span className="text-xs font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md">
                Rp 75.000
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                +1 Slot Kuota
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Highlight emas menyala & label darurat PALING BU selama 24 jam penuh + bonus otomatis 1 kuota posting iklan baru via Mayar.id.
            </p>
          </div>
        </div>
      </div>

      {/* Listings Management Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="text-base font-extrabold text-sky-950">Iklan Butuh Uang Saya</h3>
          <p className="text-xs text-slate-500">
            Kelola {myListings.length} iklan yang sedang aktif tayang
          </p>
        </div>
        <button
          onClick={onOpenSafetyGuide}
          className="text-xs text-sky-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
        >
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span>Panduan Keamanan COD</span>
        </button>
      </div>

      {/* Listing Cards List */}
      <div className="space-y-3">
        {myListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-sky-100 space-y-3">
            <Flame className="w-10 h-10 text-sky-400 mx-auto" />
            <h4 className="font-bold text-sky-950 text-sm">Belum Ada Iklan Butuh Uang</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Punya barang elektronik, laptop, gadget, atau motor yang mau dijual cepat hari ini?
            </p>
            <button
              onClick={onOpenNewListing}
              className="py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Pasang Iklan Sekarang
            </button>
          </div>
        ) : (
          myListings.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl transition-all shadow-xs ${
                item.isSuperBU
                  ? 'bg-amber-50/95 border-2 border-amber-400 ring-2 ring-amber-300 shadow-md shadow-amber-500/15'
                  : 'bg-white border border-sky-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Item Thumbnail & Info */}
                <div
                  onClick={() => onOpenListingDetail(item)}
                  className="flex items-start gap-3 cursor-pointer grow"
                >
                  <div className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border ${
                    item.isSuperBU ? 'bg-amber-100 border-amber-300' : 'bg-sky-50 border-sky-100'
                  }`}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] font-black px-1.5 py-0.2 rounded-xs bg-red-600 text-white">
                      -{item.discountPercentage}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700">
                        {item.category}
                      </span>
                      {item.isSuperBU && (
                        <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-300 text-amber-950 border border-amber-400 shadow-xs animate-pulse">
                          <Flame className="w-3 h-3 fill-red-600 text-red-600" /> PALING BU AKTIF
                        </span>
                      )}
                      {item.sundulAt && (
                        <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-300">
                          <ArrowUp className="w-3 h-3 text-sky-600" /> SUNDUL TERATAS
                        </span>
                      )}
                      {item.status === 'in_moderation' ? (
                        <span className="text-[10px] text-amber-900 font-black flex items-center gap-1 bg-amber-200 border border-amber-400 px-2 py-0.5 rounded-md animate-pulse">
                          <Clock className="w-3 h-3 text-amber-700" /> Sedang Dimoderasi Ulang
                        </span>
                      ) : (
                        <span className="text-[10px] text-sky-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-sky-500" /> Tayang & Produk Terverifikasi
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold hover:text-sky-600 line-clamp-1 ${
                      item.isSuperBU ? 'text-amber-950 font-black' : 'text-sky-950'
                    }`}>
                      {item.title}
                    </h4>

                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-black ${
                        item.isSuperBU ? 'text-amber-950' : 'text-sky-900'
                      }`}>
                        Rp {item.sellingPrice.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        Rp {item.normalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border bg-slate-50 text-slate-700 border-slate-200">
                        <Calendar className="w-3 h-3 text-sky-600" />
                        {getAdExpiryInfo(item).formattedText}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-500" />
                        Update:{' '}
                        {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                        <Eye className="w-3 h-3 text-sky-600" />
                        {item.views_count ?? item.views} Dilihat
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                        {item.favorites_count ?? item.savedCount} Favorit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Monetization & Edit Action Buttons */}
                <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-sky-50">
                  {/* Edit Iklan Button */}
                  {onEditListing && (
                    <button
                      onClick={() => onEditListing(item)}
                      className="grow sm:grow-0 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm shadow-amber-500/20"
                      title="Edit rincian, harga BU, atau minus kondisi iklan ini"
                    >
                      <Pencil className="w-3.5 h-3.5 text-white" />
                      <span>Edit Iklan</span>
                    </button>
                  )}

                  {/* Sundul Button - Sky Blue */}
                  <button
                    onClick={() => onOpenQRIS(item, 'sundul')}
                    className="grow sm:grow-0 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                    title="Sundul Iklan (Rp 25.000) - Naikkan ke posisi paling atas feed"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
                    <span>Sundul (Rp 25.000)</span>
                  </button>

                  {/* Paling BU Button */}
                  <button
                    onClick={() => onOpenQRIS(item, 'superbu')}
                    className={`grow sm:grow-0 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      item.isSuperBU
                        ? 'bg-amber-300 hover:bg-amber-400 text-amber-950 border border-amber-400 font-black shadow-xs'
                        : 'bg-amber-400 hover:bg-amber-500 text-amber-950 border border-amber-500 font-black shadow-xs'
                    }`}
                    title="Pasang Highlight Kuning & Badge PALING BU (Rp 75.000) via Mayar"
                  >
                    <Flame className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                    <span>Paling BU (Rp 75.000)</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (confirm('Hapus iklan ini dari peredaran?')) {
                        onDeleteListing(item.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-sky-50 transition cursor-pointer self-center"
                    title="Hapus Iklan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bagian Pengaturan Akun & Tombol Logout */}
      <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-sky-950">
              {hasActiveAccount ? 'Status Akun: Masuk (Aktif)' : 'Status Akun: Belum Masuk'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {hasActiveAccount
                ? `Terhubung sebagai ${currentUser.name} (${currentUser.email || currentUser.phone})`
                : 'Masuk atau daftar akun untuk menyimpan favorit dan pasang iklan BU.'}
            </p>
          </div>
        </div>

        <div>
          {hasActiveAccount ? (
            onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-xs"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Keluar dari Akun (Logout)</span>
              </button>
            )
          ) : (
            onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm shadow-sky-500/25"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
