import React, { useState, useRef } from 'react';
import {
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Camera,
  ImageOff,
} from 'lucide-react';
import { ProductPhoto } from '../../types';
import { FullscreenLightbox } from './FullscreenLightbox';

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
  const displayPhotos = photos.slice(0, 12);
  const totalPhotos = displayPhotos.length;

  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, totalPhotos - 1)))
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const pointerStartRef = useRef<{ x: number; y: number; time: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const safeIndex = Math.max(0, Math.min(activeIndex, Math.max(0, totalPhotos - 1)));
  const currentPhoto = displayPhotos[safeIndex] || displayPhotos[0];

  const handleOpenLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setIsLightboxOpen(true);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalPhotos <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalPhotos <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalPhotos);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if ((e.target as HTMLElement)?.closest('button')) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now(), moved: false };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 7 || Math.abs(dy) > 7) {
      start.moved = true;
    }
    if (totalPhotos > 1 && Math.abs(dx) >= Math.abs(dy) * 0.75) {
      const atStart = safeIndex === 0 && dx > 0;
      const atEnd = safeIndex === totalPhotos - 1 && dx < 0;
      setDragOffset(atStart || atEnd ? dx * 0.28 : dx);
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;
    setIsDragging(false);

    if (start.moved) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 60);
    }

    if (totalPhotos > 1) {
      const dx = e.clientX - start.x;
      const elapsed = Math.max(1, Date.now() - start.time);
      const velocity = Math.abs(dx) / elapsed;
      if (Math.abs(dx) > 48 || (velocity > 0.35 && Math.abs(dx) > 22)) {
        if (dx < 0 && safeIndex < totalPhotos - 1) {
          setActiveIndex(safeIndex + 1);
        } else if (dx > 0 && safeIndex > 0) {
          setActiveIndex(safeIndex - 1);
        }
      }
    }

    setDragOffset(0);
    pointerStartRef.current = null;
  };

  if (!displayPhotos || displayPhotos.length === 0) {
    return (
      <div className="w-full aspect-16/10 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col items-center justify-center text-slate-400 p-6">
        <Camera className="w-10 h-10 mb-2 text-sky-300" />
        <p className="text-xs font-semibold">Belum ada foto produk</p>
      </div>
    );
  }

  const captionText = (currentPhoto?.description || currentPhoto?.caption || '').trim();

  return (
    <div className="w-full space-y-2.5">
      {/* 1. Preview Utama (Bisa di-swipe & klik untuk buka Lightbox Full Screen) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={() => {
          if (suppressClickRef.current) return;
          handleOpenLightbox(safeIndex);
        }}
        style={{ touchAction: 'pan-y' }}
        className="group relative w-full aspect-16/10 rounded-2xl overflow-hidden bg-slate-950 border border-sky-100 shadow-sm cursor-pointer select-none"
        title="Klik untuk memperbesar layar penuh, atau geser untuk melihat foto lain"
      >
        <div
          className={`flex w-full h-full ${
            isDragging
              ? 'transition-none'
              : 'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
          }`}
          style={{
            transform: `translate3d(calc(-${safeIndex * 100}% + ${dragOffset}px), 0, 0)`,
          }}
        >
          {displayPhotos.map((photo, idx) => {
            const hasFailed = Boolean(failedUrls[photo.url]);
            return (
              <div
                key={photo.id || `${photo.url}-${idx}`}
                className="w-full h-full shrink-0 flex items-center justify-center bg-slate-950"
              >
                {hasFailed ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400 p-4">
                    <ImageOff className="w-8 h-8 text-slate-500" />
                    <span className="text-xs">Foto ke-{idx + 1} tidak tersedia</span>
                  </div>
                ) : (
                  <img
                    src={photo.url}
                    alt={photo.caption || photo.label || `Foto produk ke-${idx + 1}`}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    onError={() =>
                      setFailedUrls((prev) => ({ ...prev, [photo.url]: true }))
                    }
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Badge Overlay (e.g. PALING BU, Diskon BU) */}
        {badgeOverlay && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            {badgeOverlay}
          </div>
        )}

        {/* Indikator Halaman & Tombol Fullscreen di Pojok Kanan Atas */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-sm text-white text-xs font-semibold tabular-nums border border-white/15">
            {safeIndex + 1} / {totalPhotos}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenLightbox(safeIndex);
            }}
            className="w-9 h-9 rounded-full bg-black/65 hover:bg-sky-600 text-white backdrop-blur-sm border border-white/15 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="Lihat Layar Penuh"
            aria-label="Buka galeri layar penuh"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Tombol Panah Navigasi */}
        {totalPhotos > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/15 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Foto Sebelumnya"
              aria-label="Foto Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/15 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Foto Berikutnya"
              aria-label="Foto Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* 2. Keterangan / Caption Terpisah di Luar Area Foto (Tidak Menutupi Visual Produk) */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white border border-sky-100 text-xs">
        <p className="text-slate-700 leading-snug line-clamp-2">
          {captionText || 'Klik foto untuk tampilan layar penuh & geser untuk melihat detail lainnya.'}
        </p>
        <button
          type="button"
          onClick={() => handleOpenLightbox(safeIndex)}
          className="text-sky-700 hover:text-sky-900 font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          Layar Penuh
        </button>
      </div>

      {/* 3. Strip Thumbnail Navigasi Cepat */}
      {totalPhotos > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5">
          {displayPhotos.map((photo, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={photo.id || idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-sky-500 ring-2 ring-sky-200'
                    : 'border-sky-100 hover:border-sky-300 opacity-75 hover:opacity-100'
                }`}
                title={photo.caption || photo.label || `Pilih foto ke-${idx + 1}`}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `Thumbnail ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute bottom-1 right-1 text-[10px] font-bold px-1.5 rounded tabular-nums ${
                    isActive ? 'bg-sky-600 text-white' : 'bg-black/65 text-white'
                  }`}
                >
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Fullscreen Lightbox Modal */}
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
