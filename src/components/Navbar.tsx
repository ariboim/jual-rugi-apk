import React from 'react';
import { Flame, ShieldCheck, RefreshCw, LogOut, LogIn } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserProfile } from '../types';

interface NavbarProps {
  currentUser: UserProfile;
  onSwitchUser: () => void;
  onOpenSafetyGuide: () => void;
  onOpenNewListing: () => void;
  onOpenPromoBanner?: () => void;
  isLoggedIn?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  onOpenSafetyGuide,
  onOpenPromoBanner,
  isLoggedIn = false,
  onLogin,
  onLogout,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
      {/* Live Distress Sale Warning Marquee Bar - Soft Sky Tint */}
      <div className="bg-sky-100/80 px-3 py-1.5 text-[11px] font-medium text-sky-950 border-b border-sky-200/80 overflow-hidden flex items-center justify-between">
        <div className="flex items-center gap-1.5 shrink-0 text-sky-700 font-extrabold uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 text-sky-600 fill-sky-600 animate-pulse" />
          <span>RADAR BU:</span>
        </div>
        <div className="truncate px-2 font-medium text-[11px] text-sky-900">
          ⚠️ Wajib Transaksi COD Tatap Muka di Tempat Ramai • DILARANG Transfer DP / Uang Muka Apapun!
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenPromoBanner && (
            <button
              onClick={onOpenPromoBanner}
              className="px-2 py-0.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] tracking-wide flex items-center gap-1 shadow-xs animate-pulse cursor-pointer transition"
              title="Lihat Promo Buka Aplikasi (image_3.png)"
            >
              <span>🔥 Promo Spesial</span>
            </button>
          )}
          <button
            onClick={onOpenSafetyGuide}
            className="flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-800 hover:underline font-bold cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 inline" />
            Tips Aman
          </button>
        </div>
      </div>

      {/* Main Top Header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand - Transparent Official Logo without any frame */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 select-none cursor-pointer">
            <img
              src="/assets/aistudio/logo_transparent.png"
              alt="JualRugi.my.id"
              className="h-8 sm:h-9.5 md:h-10 w-auto object-contain select-none"
            />
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-sky-50 text-sky-700 border border-sky-200 font-extrabold uppercase tracking-wider hidden md:inline-block">
              Distress Sale
            </span>
          </div>
        </div>

        {/* Right Action Icons: PWA Install + User Switcher + Logout/Login */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <PWAInstallButton />

          {/* Quick Simulation User Switcher (Buyer vs Seller) */}
          <button
            onClick={onSwitchUser}
            title="Klik untuk beralih profil Pembeli / Penjual"
            className="flex items-center gap-1.5 sm:gap-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 sm:px-2.5 py-1.5 rounded-xl text-left transition cursor-pointer active:scale-95 shadow-xs"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-sky-300"
            />
            <div className="hidden xs:block text-left">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-sky-950 max-w-[75px] sm:max-w-[95px] truncate">
                  {currentUser.name}
                </span>
                <RefreshCw className="w-2.5 h-2.5 text-sky-600" />
              </div>
              <span
                className={`text-[8.5px] sm:text-[9px] font-bold px-1 py-0.2 rounded-xs uppercase ${
                  currentUser.role === 'seller'
                    ? 'text-amber-800 bg-amber-100'
                    : 'text-sky-700 bg-sky-100'
                }`}
              >
                {currentUser.role === 'seller' ? 'Mode Penjual' : 'Mode Pembeli'}
              </span>
            </div>
          </button>

          {/* Admin Dashboard Access */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Buka Dashboard Admin (Manajemen Iklan, Mayar & User)"
              aria-label="Dashboard Admin"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Tombol Logout (Jika Login) / Tombol Masuk (Jika Logout) */}
          {isLoggedIn ? (
            onLogout && (
              <button
                onClick={onLogout}
                title="Keluar dari akun (Logout)"
                aria-label="Tombol Keluar Akun"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )
          ) : (
            onLogin && (
              <button
                onClick={onLogin}
                title="Masuk ke Akun JualRugi.my.id"
                aria-label="Tombol Masuk Akun"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs shadow-sky-500/25"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
