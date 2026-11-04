import React, { useState } from 'react';
import {
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ProductPhoto } from '../../types';
import { FullscreenLightbox } from './FullscreenLightbox';

/**
 * =========================================================================
 * CARA INTEGRASI DATA ARRAY FOTO PRODUK (JualRugi.my.id Product Gallery)
 * =========================================================================
 * Contoh format data array yang diteruskan ke komponen <ProductGallery />:
 *
 * const contohFotoProduk: ProductPhoto[] = [
 *   {
 *     id: 'foto-1',
 *     url: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb',
 *     caption: 'Tampak Depan: Layar OLED 120Hz mulus, TrueTone aktif normal'
 *   },
 *   {
 *     id: 'foto-2',
 *     url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569',
 *     caption: 'Tampak Belakang: Kaca bodi Deep Purple utuh tanpa retak'
 *   },
 *   {
 *     id: 'foto-3',
 *     url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab',
 *     caption: 'Minus Sisi Bawah: Ada lecet pemakaian halus dekat lubang charger'
 *   }
 * ];
 *
 * Penggunaan:
 * <ProductGallery photos={contohFotoProduk} productTitle="iPhone 14 Pro 128GB" />
 * =========================================================================
 */

export interface ProductGalleryProps {
  photos: ProductPhoto[];
  productTitle?: string;
  badgeOverlay?: React.ReactNode;
  initialIndex?: number;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  photos,
  productTitle,
  badgeOverlay,
  initialIndex = 0,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(initialIndex);

  // Normalize photos list (maximum 6 photos according to requirements)
  const displayPhotos = photos.slice(0, 6);
  const totalPhotos = displayPhotos.length;
  const currentPhoto = displayPhotos[activeIndex] || displayPhotos[0];

  const handleOpenLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setIsLightboxOpen(true);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalPhotos <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalPhotos <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalPhotos);
  };

  if (!displayPhotos || displayPhotos.length === 0) {
    return (
      <div className="w-full aspect-16/10 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col items-center justify-center text-slate-400 p-6">
        <Camera className="w-10 h-10 mb-2 text-sky-300" />
        <p className="text-xs font-semibold">Belum ada foto produk</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* 1. Main Featured Photo (Hero Preview) */}
      <div
        onClick={() => handleOpenLightbox(activeIndex)}
        className="group relative w-full aspect-16/10 sm:aspect-16/10 rounded-3xl overflow-hidden bg-slate-900 border border-sky-100 shadow-sm cursor-pointer select-none transition-all hover:shadow-md"
        title="Klik untuk membuka layar penuh (Fullscreen Lightbox)"
      >
        {/* Main Photo Image */}
        <img
          src={currentPhoto.url}
          alt={currentPhoto.caption || `Foto produk ke-${activeIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
        />

        {/* Soft Vignette Overlay for Badges & Caption Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Custom Badges (e.g. PALING BU, Diskon BU, Produk Terverifikasi) */}
        {badgeOverlay && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            {badgeOverlay}
          </div>
        )}

        {/* Top-Right Action: Fullscreen Lightbox Button & Photo Counter */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-300" />
            <span>
              {activeIndex + 1} / {totalPhotos}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenLightbox(activeIndex);
            }}
            className="p-2 rounded-full bg-black/60 hover:bg-sky-500 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-md active:scale-95"
            title="Buka Layar Penuh (Fullscreen)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Chevron Left Arrow (for quick gallery navigation) */}
        {totalPhotos > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-sky-950 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer backdrop-blur-xs opacity-90 group-hover:opacity-100"
            title="Foto Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Chevron Right Arrow */}
        {totalPhotos > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-sky-950 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer backdrop-blur-xs opacity-90 group-hover:opacity-100"
            title="Foto Berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Caption Teks di Bagian Bawah Gambar (Sesuai Spesifikasi Poin 2) */}
        <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col justify-end">
          {currentPhoto.caption && currentPhoto.caption.trim().length > 0 ? (
            <div className="bg-black/70 backdrop-blur-md text-white rounded-xl px-3 py-1.5 border border-white/10 shadow-md">
              <p className="text-xs font-medium leading-snug line-clamp-2">
                {currentPhoto.caption}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-white/90 font-medium drop-shadow-md">
              <span>Klik gambar untuk tampilan layar penuh</span>
              <span className="text-sky-300 font-semibold flex items-center gap-1">
                <Eye className="w-3 h-3" /> Zoom Full
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Grid & Slider Thumbnail Rapi (Menampilkan hingga 6 foto produk) */}
      {totalPhotos > 1 && (
        <div className="bg-white p-2.5 rounded-2xl border border-sky-100 shadow-xs">
          <div className="grid grid-cols-6 gap-2">
            {displayPhotos.map((photo, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={photo.id || idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-sky-500 ring-2 ring-sky-200 shadow-md scale-102'
                      : 'border-sky-100 hover:border-sky-300 opacity-75 hover:opacity-100'
                  }`}
                  title={photo.caption || `Pilih foto ke-${idx + 1}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Nomor Urut Thumbnail */}
                  <span
                    className={`absolute bottom-1 right-1 text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? 'bg-sky-500 text-white'
                        : 'bg-black/60 text-white backdrop-blur-xs'
                    }`}
                  >
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Fullscreen Lightbox / Modal Zoom */}
      <FullscreenLightbox
        photos={displayPhotos}
        initialIndex={lightboxStartIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        productTitle={productTitle}
      />
    </div>
  );
};
