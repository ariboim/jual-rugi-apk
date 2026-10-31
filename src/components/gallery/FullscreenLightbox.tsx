import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import { ProductPhoto } from '../../types';

/**
 * Prop type untuk FullscreenLightbox
 * Data foto yang diintegrasikan berupa array objek:
 * [
 *   { id: '1', url: 'https://...', caption: 'Tampak depan layar OLED' },
 *   { id: '2', url: 'https://...', caption: 'Bagian belakang kamera mulus' }
 * ]
 */
export interface FullscreenLightboxProps {
  photos: ProductPhoto[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
}

export const FullscreenLightbox: React.FC<FullscreenLightboxProps> = ({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
  productTitle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync initialIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setSwipeOffset(0);
    }
  }, [isOpen, initialIndex]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);

  const totalPhotos = photos.length;
  const currentPhoto = photos[currentIndex] || photos[0];

  const handlePrev = useCallback(() => {
    if (totalPhotos <= 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
    setIsZoomed(false);
    setTimeout(() => setIsAnimating(false), 250);
  }, [totalPhotos]);

  const handleNext = useCallback(() => {
    if (totalPhotos <= 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % totalPhotos);
    setIsZoomed(false);
    setTimeout(() => setIsAnimating(false), 250);
  }, [totalPhotos]);

  // Keyboard navigation (Escape, Left, Right)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Lock body scroll when lightbox is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Touch gesture swipe handlers for mobile full-view
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return; // allow pan when zoomed
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isZoomed || touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    // Track horizontal swipe if dominant
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setSwipeOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (isZoomed || touchStartX.current === null) return;
    const diffX = swipeOffset;
    const duration = Date.now() - touchStartTime.current;

    if (Math.abs(diffX) > 45 || (Math.abs(diffX) > 25 && duration < 250)) {
      if (diffX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    setSwipeOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 text-white select-none transition-opacity duration-300 backdrop-blur-md animate-fade-in"
    >
      {/* Top Header Bar: Back button, photo title & counter */}
      <div className="relative z-20 flex items-center justify-between px-3 sm:px-6 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Tombol Navigasi Kembali / Tutup di Pojok Kiri Atas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-md border border-white/10 shadow-lg"
            title="Kembali ke galeri produk"
            aria-label="Tutup lightbox"
          >
            <ArrowLeft className="w-5 h-5 text-sky-300" />
            <span className="text-xs font-semibold sm:inline hidden">Kembali</span>
          </button>

          {/* Judul Produk Singkat jika ada */}
          {productTitle && (
            <p className="text-xs text-slate-300 font-medium truncate max-w-[180px] sm:max-w-xs ml-2 hidden xs:block">
              {productTitle}
            </p>
          )}
        </div>

        {/* Counter foto (misal: "1 / 6") & Toggle Zoom */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-sky-200 backdrop-blur-md">
            {currentIndex + 1} / {totalPhotos}
          </div>

          {/* Toggle Zoom Button */}
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10"
            title={isZoomed ? 'Perkecil' : 'Perbesar foto'}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4 text-sky-300" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Tombol Silang (X) alternatif */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Fullscreen Stage: Photo with touch gestures & swipe navigation */}
      <div
        className="relative grow flex items-center justify-center overflow-hidden px-2 sm:px-12 py-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Previous (Desktop/Tablet) */}
        {totalPhotos > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-sky-600/80 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-xl backdrop-blur-md active:scale-90"
            title="Foto Sebelumnya (Panah Kiri)"
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Container Gambar */}
        <div
          className={`w-full h-full flex items-center justify-center transition-transform duration-200 ${
            isAnimating ? 'opacity-80 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            transform: isZoomed
              ? 'scale(1.5)'
              : `translateX(${swipeOffset * 0.4}px)`,
            cursor: isZoomed ? 'zoom-out' : 'zoom-in',
          }}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <img
            key={currentPhoto.url + currentIndex}
            src={currentPhoto.url}
            alt={currentPhoto.caption || `Foto produk ke-${currentIndex + 1}`}
            className="max-w-full max-h-[78vh] object-contain select-none drop-shadow-2xl rounded-lg transition-transform duration-300"
            draggable={false}
          />
        </div>

        {/* Navigation Arrow Next (Desktop/Tablet) */}
        {totalPhotos > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-sky-600/80 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-xl backdrop-blur-md active:scale-90"
            title="Foto Berikutnya (Panah Kanan)"
            aria-label="Foto berikutnya"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Footer: Caption Box & Mini Thumbnail Strip */}
      <div className="relative z-20 flex flex-col gap-2 p-3 sm:p-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
        {/* Caption Teks Produk (jika diisi penjual) */}
        {currentPhoto.caption && currentPhoto.caption.trim().length > 0 ? (
          <div className="mx-auto max-w-xl w-full bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg text-center">
            <p className="text-xs sm:text-sm text-sky-100 font-medium leading-relaxed">
              "{currentPhoto.caption}"
            </p>
          </div>
        ) : (
          <div className="mx-auto text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              Geser layar ↔ atau gunakan tombol panah untuk melihat foto lainnya
            </span>
          </div>
        )}

        {/* Mini Thumbnail Strip (Menampilkan hingga 6 foto untuk navigasi cepat) */}
        {totalPhotos > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2">
            {photos.map((p, idx) => (
              <button
                key={p.id || idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsZoomed(false);
                }}
                className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'border-sky-400 scale-110 shadow-md ring-2 ring-sky-400/50'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={p.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
