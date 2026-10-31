import React from 'react';
import { Flame, ShieldCheck, RefreshCw } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserProfile } from '../types';

interface NavbarProps {
  currentUser: UserProfile;
  onSwitchUser: () => void;
  onOpenSafetyGuide: () => void;
  onOpenNewListing: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  onOpenSafetyGuide,
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
        <button
          onClick={onOpenSafetyGuide}
          className="shrink-0 flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-800 hover:underline font-bold cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 inline" />
          Tips Aman
        </button>
      </div>

      {/* Main Top Header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center font-black text-white text-base shadow-sm shadow-sky-500/25 border border-sky-300">
              JR
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg sm:text-xl tracking-tight text-sky-950">
                Jual<span className="text-sky-500">Rugi</span>
                <span className="text-xs text-amber-500 font-extrabold">.id</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-sky-50 text-sky-700 border border-sky-200 font-extrabold uppercase tracking-wider">
                Distress Sale
              </span>
            </div>
            <p className="text-[10px] text-slate-500 -mt-0.5 font-medium hidden sm:block">
              Bursa Barang Bekas Butuh Uang (BU) Diskon Ekstrim • 100% COD
            </p>
          </div>
        </div>

        {/* Right Action Icons: PWA Install + User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton />

          {/* Quick Simulation User Switcher (Buyer vs Seller) */}
          <button
            onClick={onSwitchUser}
            title="Klik untuk beralih profil Pembeli / Penjual"
            className="flex items-center gap-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1.5 rounded-xl text-left transition cursor-pointer active:scale-95 shadow-xs"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover border border-sky-300"
            />
            <div className="hidden xs:block text-left">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-sky-950 max-w-[85px] truncate">
                  {currentUser.name}
                </span>
                <RefreshCw className="w-2.5 h-2.5 text-sky-600" />
              </div>
              <span
                className={`text-[9px] font-bold px-1 py-0.2 rounded-xs uppercase ${
                  currentUser.role === 'seller'
                    ? 'text-amber-800 bg-amber-100'
                    : 'text-sky-700 bg-sky-100'
                }`}
              >
                {currentUser.role === 'seller' ? 'Mode Penjual' : 'Mode Pembeli'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
