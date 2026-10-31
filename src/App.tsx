/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  Search,
  MapPin,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Laptop,
  Tv,
  Bike,
  X,
  CheckCircle2,
} from 'lucide-react';

import { Category, CATEGORIES, Listing, UserProfile } from './types';
import { INITIAL_LISTINGS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { ListingCard } from './components/ListingCard';
import { ListingDetailModal } from './components/ListingDetailModal';
import { PostListingModal } from './components/PostListingModal';
import { ChatModal } from './components/ChatModal';
import { QRISModal, MonetizationType } from './components/QRISModal';
import { SellerDashboard } from './components/SellerDashboard';
import { CODSafetyGuideModal } from './components/CODSafetyGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';

// User simulation profiles
const BUYER_USER: UserProfile = {
  id: 'buyer-rian',
  name: 'Rian Pratama',
  role: 'buyer',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  email: 'rian.pratama@gmail.com',
  phone: '0812-9988-7766',
  city: 'Jakarta Selatan',
};

const SELLER_USER: UserProfile = {
  id: 'seller-agus',
  name: 'Agus Setiawan',
  role: 'seller',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  email: 'agus.setiawan@gmail.com',
  phone: '0812-8899-1234',
  city: 'Jakarta Selatan',
};

export default function App() {
  const [listings, setListings] = useState<Listing[]>(() => {
    try {
      const saved = localStorage.getItem('jualrugi_listings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_LISTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('jualrugi_listings', JSON.stringify(listings));
    } catch (e) {
      console.error(e);
    }
  }, [listings]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Filter & Search state
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [minDiscountFilter, setMinDiscountFilter] = useState<number>(0);
  const [sortOption, setSortOption] = useState<'urgent' | 'discount' | 'price_low' | 'newest'>('urgent');

  // Modal states
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [activeChatListing, setActiveChatListing] = useState<Listing | null>(null);
  const [chatInitialOffer, setChatInitialOffer] = useState<string | undefined>(undefined);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSafetyGuideOpen, setIsSafetyGuideOpen] = useState(false);

  // Monetization QRIS modal state
  const [isQRISModalOpen, setIsQRISModalOpen] = useState(false);
  const [qrisListing, setQrisListing] = useState<Listing | null>(null);
  const [qrisType, setQrisType] = useState<MonetizationType>('sundul');

  // User Profile simulation state
  const [currentUser, setCurrentUser] = useState<UserProfile>(BUYER_USER);

  // AI Approval Push Notification Banner
  const [aiApprovalNotification, setAiApprovalNotification] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSwitchUser = () => {
    setCurrentUser((prev) => (prev.id === BUYER_USER.id ? SELLER_USER : BUYER_USER));
    showToast(`Beralih profil ke: ${currentUser.id === BUYER_USER.id ? SELLER_USER.name + ' (Seller)' : BUYER_USER.name + ' (Buyer)'}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleListingApproved = (newListing: Listing) => {
    setListings((prev) => [newListing, ...prev]);
    setAiApprovalNotification(
      `🎉 Selamat! Iklan ${newListing.title} Anda lolos verifikasi AI dan telah tayang!`
    );
    setActiveTab('home');

    setTimeout(() => {
      setAiApprovalNotification(null);
    }, 8000);
  };

  const handleQRISSuccess = (listingId: string, type: MonetizationType) => {
    const now = new Date().toISOString();
    let updatedTitle = '';

    setListings((prev) => {
      const idx = prev.findIndex((item) => item.id === listingId);
      if (idx === -1) return prev;

      const target = { ...prev[idx] };
      updatedTitle = target.title;
      target.createdAt = now;
      target.sundulAt = now;

      if (type === 'superbu') {
        target.isSuperBU = true;
        target.superBUExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      // Move directly to the very top (index 0) of the listings array
      const remaining = prev.filter((item) => item.id !== listingId);
      return [target, ...remaining];
    });

    if (type === 'sundul') {
      showToast('🚀 Iklan BERHASIL DISUNDUL! Naik ke urutan #1 teratas feed!');
    } else {
      showToast('🔥 Iklan berhasil diubah menjadi PALING BU! Highlight kuning penuh aktif.');
    }

    // Switch to home feed so user immediately sees their listing at the very top
    setActiveTab('home');
  };

  const handleDeleteListing = (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    showToast('Iklan berhasil dihapus.');
  };

  const handleOpenChat = (listing: Listing, initialText?: string) => {
    setSelectedListing(null);
    setActiveChatListing(listing);
    setChatInitialOffer(initialText);
  };

  const handleQuickMakeOffer = (listing: Listing, offerPrice: number) => {
    const text = `Halo kak! Saya minat serius ${listing.title}. Boleh saya tawar di harga Rp ${offerPrice.toLocaleString('id-ID')}? Kalau boleh, kita langsung COD hari ini di tempat ramai.`;
    handleOpenChat(listing, text);
  };

  const handleOpenQRIS = (listing: Listing, type: MonetizationType) => {
    setQrisListing(listing);
    setQrisType(type);
    setIsQRISModalOpen(true);
  };

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    listings.forEach((l) => cities.add(l.location));
    return Array.from(cities);
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchLoc = item.location.toLowerCase().includes(q);
          const matchCond = item.condition.toLowerCase().includes(q);
          if (!matchTitle && !matchLoc && !matchCond) return false;
        }
        if (selectedCity && !item.location.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
        if (minDiscountFilter > 0 && item.discountPercentage < minDiscountFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // 1. Most recent sundul timestamp always places an item at the absolute #1 top
        const aSundul = a.sundulAt ? new Date(a.sundulAt).getTime() : 0;
        const bSundul = b.sundulAt ? new Date(b.sundulAt).getTime() : 0;
        if (aSundul > 0 || bSundul > 0) {
          if (aSundul !== bSundul) {
            return bSundul - aSundul;
          }
        }

        // 2. PALING BU (isSuperBU) listings always prioritized at the top of the feed
        if (a.isSuperBU && !b.isSuperBU) return -1;
        if (!a.isSuperBU && b.isSuperBU) return 1;

        if (sortOption === 'discount') {
          return b.discountPercentage - a.discountPercentage;
        }
        if (sortOption === 'price_low') {
          return a.sellingPrice - b.sellingPrice;
        }
        if (sortOption === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [listings, selectedCategory, searchQuery, selectedCity, minDiscountFilter, sortOption]);

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'Smartphone & Gadget':
        return Smartphone;
      case 'Laptop & Komputer':
        return Laptop;
      case 'Elektronik Rumah Tangga':
        return Tv;
      case 'Sepeda Motor':
        return Bike;
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f9ff] text-slate-800 flex flex-col font-sans">
      <OfflineIndicator />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenSafetyGuide={() => setIsSafetyGuideOpen(true)}
        onOpenNewListing={() => setIsPostModalOpen(true)}
      />

      {/* In-App Push Notification Banner for AI Approval - Lowered position for clear visibility */}
      {aiApprovalNotification && (
        <div className="fixed top-24 sm:top-28 left-4 right-4 max-w-xl mx-auto z-50 animate-slide-down">
          <div className="bg-sky-500 text-white px-4 py-3.5 rounded-2xl shadow-xl shadow-sky-900/25 border-2 border-white/40 flex items-center justify-between gap-3 backdrop-blur-sm">
            <div className="flex items-center gap-3 grow">
              <span className="p-1.5 rounded-xl bg-white/20 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </span>
              <div className="text-xs sm:text-sm font-extrabold tracking-normal leading-snug">
                {aiApprovalNotification}
              </div>
            </div>
            <button
              onClick={() => setAiApprovalNotification(null)}
              className="p-1.5 hover:bg-white/20 rounded-xl text-white shrink-0 cursor-pointer transition active:scale-90"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating System Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 bg-sky-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in border border-sky-400">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="grow">
        {/* TAB: BERANDA (FEED) */}
        {activeTab === 'home' && (
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-5 pb-24">
            {/* Sky Blue Themed Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-white p-5 sm:p-7 border border-sky-100 shadow-sm">
              <div className="relative z-10 max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-sky-500 text-sky-500 animate-pulse" />
                  BURSA DISTRESS SALE • 100% COD
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Barang Bekas Murah <span className="text-sky-600">Butuh Uang Cepat</span>.
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Penjual BU dapat dana hari ini, pembeli dapat harga rugi ekstrim. Wajib COD tatap muka di tempat umum ramai tanpa risiko transfer DP!
                </p>

                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  {/* Sky Blue Primary CTA Button */}
                  <button
                    onClick={() => setIsPostModalOpen(true)}
                    className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-sm shadow-sky-500/25 cursor-pointer active:scale-95 transition"
                  >
                    + Jual Barang BU Sekarang
                  </button>
                  <button
                    onClick={() => setIsSafetyGuideOpen(true)}
                    className="py-2.5 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Panduan COD Anti-Tipu</span>
                  </button>
                </div>
              </div>

              {/* Decorative Subtle Accent */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 hidden sm:block pointer-events-none">
                <Flame className="w-48 h-48 text-sky-400" />
              </div>
            </div>

            {/* Quick Search & Filter Bar - Sky & White Palette */}
            <div className="bg-white p-3 rounded-2xl border border-sky-100 shadow-xs flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative grow w-full">
                <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari iPhone, ROG, Beat, Kulkas, atau lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-sky-50/50 border border-sky-200 focus:border-sky-500 text-slate-900 placeholder-slate-400 text-xs outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* City Quick Dropdown */}
              <div className="w-full sm:w-48">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-800 text-xs outline-none cursor-pointer focus:border-sky-500"
                >
                  <option value="">Semua Lokasi COD</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>
                      📍 {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting Filter */}
              <div className="w-full sm:w-48">
                <select
                  value={sortOption}
                  onChange={(e) =>
                    setSortOption(
                      e.target.value as 'urgent' | 'discount' | 'price_low' | 'newest'
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-800 text-xs outline-none cursor-pointer focus:border-sky-500"
                >
                  <option value="urgent">🔥 Super BU Teratas</option>
                  <option value="discount">📉 Diskon Tertinggi</option>
                  <option value="price_low">💰 Harga Termurah</option>
                  <option value="newest">⏱️ Terbaru Masuk</option>
                </select>
              </div>
            </div>

            {/* Strictly 4 Categories Pill Selectors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>KATEGORI BARANG (4 KATEGORI UTAMA):</span>
                <span className="text-[11px] text-slate-500">
                  {filteredListings.length} Iklan Aktif
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* "Semua" pill */}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                    selectedCategory === 'all'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs shadow-sky-500/25'
                      : 'bg-white text-slate-700 border-sky-100 hover:border-sky-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Semua BU</span>
                </button>

                {/* 4 Strictly Required Categories */}
                {CATEGORIES.map((cat) => {
                  const Icon = getCategoryIcon(cat);
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs shadow-sky-500/25'
                          : 'bg-white text-slate-700 border-sky-100 hover:border-sky-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-sky-500" />
                      <span className="truncate">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Discount Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-slate-500 font-semibold text-[11px] shrink-0">
                Filter Cepat:
              </span>
              {[
                { label: 'Semua Diskon', val: 0 },
                { label: 'Diskon > 35%', val: 35 },
                { label: 'Diskon > 45%', val: 45 },
              ].map((chip) => (
                <button
                  key={chip.val}
                  onClick={() => setMinDiscountFilter(chip.val)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer shrink-0 ${
                    minDiscountFilter === chip.val
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-white text-slate-600 border-sky-100 hover:text-sky-600'
                  }`}
                >
                  {chip.label}
                </button>
              ))}

              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setSelectedCity('');
                  setMinDiscountFilter(0);
                }}
                className="text-[11px] text-slate-500 underline ml-auto shrink-0 cursor-pointer hover:text-sky-600"
              >
                Reset Filter
              </button>
            </div>

            {/* Responsive Product Card Grid */}
            {filteredListings.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-sky-100 space-y-3 shadow-xs">
                <Search className="w-10 h-10 text-sky-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Tidak Ditemukan Iklan yang Sesuai</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian, pilih lokasi lain, atau pasang iklan barang yang Anda cari.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setSelectedCity('');
                    setMinDiscountFilter(0);
                  }}
                  className="py-2 px-4 rounded-xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 cursor-pointer shadow-xs shadow-sky-500/25"
                >
                  Tampilkan Semua Iklan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredListings.map((item) => (
                  <ListingCard
                    key={item.id}
                    listing={item}
                    onClick={() => setSelectedListing(item)}
                    onQuickChat={(e) => {
                      e.stopPropagation();
                      handleOpenChat(item);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CARI & FILTER */}
        {activeTab === 'search' && (
          <div className="max-w-3xl mx-auto px-4 py-5 space-y-5 pb-24 text-slate-800">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-sky-950">Pencarian Barang Distress Sale</h2>
              <p className="text-xs text-slate-500">Temukan barang murah Butuh Uang di kota Anda</p>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-sky-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Ketik tipe hp, laptop, motor, kulkas, kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-sky-200 focus:border-sky-500 text-slate-900 placeholder-slate-400 text-sm outline-none shadow-xs"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Pilih Kategori:</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = getCategoryIcon(cat);
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() =>
                        setSelectedCategory((prev) => (prev === cat ? 'all' : cat))
                      }
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs shadow-sky-500/25'
                          : 'bg-white text-slate-700 border-sky-100 hover:border-sky-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-sky-500" />
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* City Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Kota Lokasi COD:</label>
              <div className="flex flex-wrap gap-2">
                {['Jakarta', 'Bekasi', 'Bandung', 'Surabaya', 'Tangerang', 'Depok', 'Semarang'].map(
                  (city) => (
                    <button
                      key={city}
                      onClick={() =>
                        setSelectedCity((prev) => (prev === city ? '' : city))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        selectedCity === city
                          ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                          : 'bg-white text-slate-600 border-sky-100 hover:border-sky-300'
                      }`}
                    >
                      📍 {city}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Results Button - Sky Blue */}
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('home')}
                className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm shadow-md shadow-sky-500/25 cursor-pointer transition active:scale-98"
              >
                Lihat {filteredListings.length} Hasil Iklan BU
              </button>
            </div>
          </div>
        )}

        {/* TAB: PASANG IKLAN */}
        {activeTab === 'post' && (
          <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4 pb-24 text-slate-800">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto shadow-xs">
              <Flame className="w-8 h-8 fill-sky-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-sky-950">Pasang Iklan Butuh Uang (BU)</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Semua iklan wajib lolos inspeksi <strong>Gatekeeper AI Gemini Multimodal</strong> untuk memverifikasi foto fisik asli dan diskon wajar.
            </p>
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="py-3 px-6 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-sm shadow-md shadow-sky-500/25 cursor-pointer"
            >
              Buka Form Pasang Iklan
            </button>
          </div>
        )}

        {/* TAB: CHAT DIRECT (P2P) */}
        {activeTab === 'chat' && (
          <div className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-24 text-slate-800">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-sky-950">Percakapan P2P Langsung</h2>
              <p className="text-xs text-slate-500">
                Pilih iklan aktif untuk mulai obrolan & negosiasi titik temu COD
              </p>
            </div>

            {/* Pinned Safety Reminder Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2.5 shadow-xs border border-amber-400">
              <ShieldCheck className="w-5 h-5 shrink-0 text-amber-900" />
              <span>
                Peringatan: JualRugi.id tidak menengahi pembayaran. Jangan pernah transfer DP atau uang muka kepada siapapun!
              </span>
            </div>

            {/* Recent Listings to Chat With */}
            <div className="space-y-2">
              {listings.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenChat(item)}
                  className="p-3.5 rounded-2xl bg-white border border-sky-100 hover:border-sky-300 shadow-xs flex items-center justify-between gap-3 cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-3 truncate">
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-sky-100"
                    />
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        Penjual: {item.seller.name} • {item.location}
                      </p>
                      <span className="text-xs font-black text-sky-800">
                        Rp {item.sellingPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <button className="py-1.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shrink-0 shadow-xs shadow-sky-500/20">
                    Buka Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AKUN & IKLAN SAYA */}
        {activeTab === 'account' && (
          <SellerDashboard
            currentUser={currentUser}
            listings={listings}
            onOpenNewListing={() => setIsPostModalOpen(true)}
            onOpenQRIS={handleOpenQRIS}
            onDeleteListing={handleDeleteListing}
            onOpenListingDetail={(listing) => setSelectedListing(listing)}
            onOpenSafetyGuide={() => setIsSafetyGuideOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'post') {
            setIsPostModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        unreadCount={1}
      />

      {/* MODALS */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onOpenChat={(listing) => handleOpenChat(listing)}
          onQuickMakeOffer={handleQuickMakeOffer}
        />
      )}

      {isPostModalOpen && (
        <PostListingModal
          onClose={() => setIsPostModalOpen(false)}
          currentUser={currentUser}
          onListingApproved={handleListingApproved}
        />
      )}

      {activeChatListing && (
        <ChatModal
          key={activeChatListing.id}
          onClose={() => {
            setActiveChatListing(null);
            setChatInitialOffer(undefined);
          }}
          listing={activeChatListing}
          currentUser={currentUser}
          initialOfferText={chatInitialOffer}
        />
      )}

      {isQRISModalOpen && qrisListing && (
        <QRISModal
          onClose={() => setIsQRISModalOpen(false)}
          listing={qrisListing}
          type={qrisType}
          onSuccess={handleQRISSuccess}
        />
      )}

      {isSafetyGuideOpen && (
        <CODSafetyGuideModal
          isOpen={isSafetyGuideOpen}
          onClose={() => setIsSafetyGuideOpen(false)}
        />
      )}
    </div>
  );
}
