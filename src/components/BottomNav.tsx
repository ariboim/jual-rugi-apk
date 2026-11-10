import React from 'react';
import { Home, Search, PlusCircle, User } from 'lucide-react';

export type TabType = 'home' | 'search' | 'post' | 'chat' | 'account';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unreadCount?: number;
  sellerListingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-sky-100 pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-around px-3 py-1.5">
        {/* Beranda */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'home'
              ? 'text-sky-600 font-black'
              : 'text-slate-400 hover:text-sky-600'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Beranda</span>
        </button>

        {/* Cari & Filter */}
        <button
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'search'
              ? 'text-sky-600 font-black'
              : 'text-slate-400 hover:text-sky-600'
          }`}
        >
          <Search className={`w-5 h-5 ${activeTab === 'search' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Cari BU</span>
        </button>

        {/* Center CTA: Pasang Iklan BU (Sky Blue) */}
        <button
          onClick={() => onSelectTab('post')}
          className="relative -top-3.5 flex flex-col items-center justify-center group cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-sky-500 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/35 border-4 border-white text-white transition-all group-hover:scale-105 group-hover:from-sky-600 group-hover:to-sky-500">
            <PlusCircle className="w-6 h-6 stroke-[2.5] text-white" />
          </div>
          <span className="text-[10px] font-black text-sky-800 tracking-wide mt-0.5">
            Jual BU
          </span>
        </button>

        {/* Akun & Dashboard Penjual */}
        <button
          onClick={() => onSelectTab('account')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'account'
              ? 'text-sky-600 font-black'
              : 'text-slate-400 hover:text-sky-600'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'account' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Iklan Saya</span>
        </button>
      </div>
    </nav>
  );
};
