import React from 'react';
import {
  Flame,
  ArrowUp,
  Eye,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  PlusCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Listing, UserProfile } from '../types';
import { MonetizationType } from './QRISModal';

interface SellerDashboardProps {
  currentUser: UserProfile;
  listings: Listing[];
  onOpenNewListing: () => void;
  onOpenQRIS: (listing: Listing, type: MonetizationType) => void;
  onDeleteListing: (listingId: string) => void;
  onOpenListingDetail: (listing: Listing) => void;
  onOpenSafetyGuide: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentUser,
  listings,
  onOpenNewListing,
  onOpenQRIS,
  onDeleteListing,
  onOpenListingDetail,
  onOpenSafetyGuide,
}) => {
  const myListings = React.useMemo(() => {
    return listings
      .filter((l) => l.seller.id === currentUser.id || l.seller.id === 'seller-agus')
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

        {/* Sky Blue Button - No Black */}
        <button
          onClick={onOpenNewListing}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-500/20 cursor-pointer active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Pasang Iklan Baru</span>
        </button>
      </div>

      {/* Monetization Feature Callout Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-sky-100 p-4 rounded-2xl shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0">
            <ArrowUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-sky-950 flex items-center gap-1.5">
              <span>Sundul Iklan</span>
              <span className="text-[10px] font-black bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-xs">
                Rp 5.000
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pindahkan posisi iklan Anda langsung ke urutan paling atas di feed secara instan agar cepat laku dilirik calon pembeli COD.
            </p>
          </div>
        </div>

        <div className="bg-white border border-amber-300 p-4 rounded-2xl shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <Flame className="w-5 h-5 fill-red-600 text-red-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-sky-950 flex items-center gap-1.5">
              <span>Pasang Badge Paling BU</span>
              <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-xs">
                Rp 15.000
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Dapatkan highlight kuning penuh di seluruh iklan, label darurat PALING BU, dan prioritas tampil di feed teratas selama 24 jam penuh.
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
                      <span className="text-[10px] text-sky-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-sky-500" /> Tayang & Terverifikasi AI
                      </span>
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

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-500" />
                        Update:{' '}
                        {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-sky-500" />
                        {item.views} Dilihat
                      </span>
                    </div>
                  </div>
                </div>

                {/* Monetization Action Buttons */}
                <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-sky-50">
                  {/* Sundul Button - Sky Blue */}
                  <button
                    onClick={() => onOpenQRIS(item, 'sundul')}
                    className="grow sm:grow-0 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                    title="Sundul Iklan (Rp 5.000) - Naikkan ke posisi paling atas feed"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
                    <span>Sundul (Rp 5.000)</span>
                  </button>

                  {/* Paling BU Button */}
                  <button
                    onClick={() => onOpenQRIS(item, 'superbu')}
                    disabled={item.isSuperBU}
                    className={`grow sm:grow-0 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      item.isSuperBU
                        ? 'bg-amber-200 text-amber-950/70 border border-amber-300 cursor-default'
                        : 'bg-amber-400 hover:bg-amber-500 text-amber-950 border border-amber-500 font-black shadow-xs'
                    }`}
                    title="Pasang Highlight Kuning & Badge PALING BU (Rp 15.000)"
                  >
                    <Flame className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                    <span>{item.isSuperBU ? 'Paling BU Aktif' : 'Paling BU (Rp 15.000)'}</span>
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
    </div>
  );
};
