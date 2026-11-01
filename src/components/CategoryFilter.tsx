import React from 'react';
import { Smartphone, Laptop, Tv, Bike, Layers, Sparkles } from 'lucide-react';
import { Category } from '../types';

export interface CategoryFilterItem {
  id: Category;
  label: string;       // 'Smartphone', 'Laptop', 'Electronic', 'Motorcycle'
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CATEGORY_ITEMS: CategoryFilterItem[] = [
  {
    id: 'Smartphone & Gadget',
    label: 'Smartphone',
    subtext: 'HP & Gadget',
    icon: Smartphone,
  },
  {
    id: 'Laptop & Komputer',
    label: 'Laptop',
    subtext: 'PC & Laptop',
    icon: Laptop,
  },
  {
    id: 'Elektronik Rumah Tangga',
    label: 'Electronic',
    subtext: 'TV & Elektronik',
    icon: Tv,
  },
  {
    id: 'Sepeda Motor',
    label: 'Motorcycle',
    subtext: 'Motor & Roda 2',
    icon: Bike,
  },
];

interface CategoryFilterProps {
  selectedCategory: Category | 'all';
  onSelectCategory: (cat: Category | 'all') => void;
  categoryCounts?: Record<string, number>;
  className?: string;
}

/**
 * Komponen Category Filter di bagian atas halaman utama (Home Feed).
 * Menyediakan filter cepat untuk kategori:
 * - 'Smartphone'
 * - 'Laptop'
 * - 'Electronic'
 * - 'Motorcycle'
 * serta opsi 'Semua' untuk mereset filter.
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
  className = '',
}) => {
  return (
    <div
      className={`w-full bg-white rounded-3xl p-3.5 sm:p-4 border border-sky-100 shadow-sm space-y-3 ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-sky-600 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-sky-950 uppercase tracking-wider">
              Kategori Pilihan (Category Filter)
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500">
              Pilih kategori untuk memfilter barang BU secara instan
            </p>
          </div>
        </div>

        {selectedCategory !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className="text-[11px] sm:text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-full cursor-pointer transition active:scale-95 border border-sky-200"
          >
            Tampilkan Semua
          </button>
        )}
      </div>

      {/* Grid Filter Buttons: Semua + 4 Categories */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5">
        {/* 'Semua' / All Category Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 text-left ${
            selectedCategory === 'all'
              ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/25 ring-2 ring-sky-300'
              : 'bg-sky-50/50 hover:bg-sky-100/70 text-slate-700 border-sky-100'
          }`}
          title="Tampilkan semua kategori iklan"
        >
          <div
            className={`p-2 rounded-xl shrink-0 transition-colors flex items-center justify-center ${
              selectedCategory === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-white text-sky-600 shadow-xs'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                selectedCategory === 'all' ? 'text-amber-300' : 'text-sky-600'
              }`}
            />
          </div>
          <div className="min-w-0">
            <p
              className={`text-xs sm:text-sm font-extrabold truncate ${
                selectedCategory === 'all' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Semua
            </p>
            <p
              className={`text-[10px] sm:text-xs truncate ${
                selectedCategory === 'all' ? 'text-sky-100 font-medium' : 'text-slate-500'
              }`}
            >
              {categoryCounts['all'] !== undefined
                ? `${categoryCounts['all']} Iklan`
                : 'Semua BU'}
            </p>
          </div>
        </button>

        {/* 4 Required Categories: Smartphone, Laptop, Electronic, Motorcycle */}
        {CATEGORY_ITEMS.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedCategory === item.id;
          const count = categoryCounts[item.id];

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectCategory(isSelected ? 'all' : item.id)}
              className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 text-left ${
                isSelected
                  ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/25 ring-2 ring-sky-300'
                  : 'bg-sky-50/50 hover:bg-sky-100/70 text-slate-700 border-sky-100'
              }`}
              title={`Filter kategori ${item.label}`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 transition-colors flex items-center justify-center ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-sky-600 shadow-xs'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs sm:text-sm font-extrabold truncate ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`text-[10px] sm:text-xs truncate ${
                    isSelected ? 'text-sky-100 font-medium' : 'text-slate-500'
                  }`}
                >
                  {count !== undefined ? `${count} Iklan` : item.subtext}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
