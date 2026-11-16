import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  ImageOff,
} from 'lucide-react';
import { ProductPhoto } from '../../types';

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
  const safeTotal = photos.length;
  const clampIndex = useCallback(
    (idx: number) => Math.max(0, Math.min(idx, Math.max(0, safeTotal - 1))),
    [safeTotal]
  );

  const [currentIndex, setCurrentIndex] = useState(() => clampIndex(initialIndex));
  const [isZoomed, setIsZoomed] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCaptionCollapsed, setIsCaptionCollapsed] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointerStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);
  const suppressNextClickRef = useRef(false);

  // Sync initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(clampIndex(initialIndex));
      setIsZoomed(false);
      setPanOffset({ x: 0, y: 0 });
      setDragOffset(0);
      setIsDragging(false);
      setIsCaptionCollapsed(false);
    }
  }, [isOpen, initialIndex, clampIndex]);

  const goToIndex = useCallback(
    (nextIdx: number) => {
      if (safeTotal <= 0) return;
      const target = clampIndex(nextIdx);
      setCurrentIndex(target);
      setIsZoomed(false);
      setPanOffset({ x: 0, y: 0 });
      setDragOffset(0);
    },
    [safeTotal, clampIndex]
  );

  const handlePrev = useCallback(() => {
    if (safeTotal <= 1) return;
    goToIndex(currentIndex > 0 ? currentIndex - 1 : safeTotal - 1);
  }, [currentIndex, safeTotal, goToIndex]);

  const handleNext = useCallback(() => {
    if (safeTotal <= 1) return;
    goToIndex(currentIndex < safeTotal - 1 ? currentIndex + 1 : 0);
  }, [currentIndex, safeTotal, goToIndex]);

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
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

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Unified Pointer Events for touch swipe (mobile) & mouse drag (desktop)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if ((e.target as HTMLElement)?.closest('button')) return;

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      panX: panOffset.x,
      panY: panOffset.y,
      moved: false,
    };
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      start.moved = true;
    }

    if (isZoomed) {
      setPanOffset({
        x: Math.max(-240, Math.min(240, start.panX + dx)),
        y: Math.max(-240, Math.min(240, start.panY + dy)),
      });
      return;
    }

    // Apply subtle edge resistance on first/last slide when swiping beyond bounds
    if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
      const atStartEdge = currentIndex === 0 && dx > 0;
      const atEndEdge = currentIndex === safeTotal - 1 && dx < 0;
      const resisted = atStartEdge || atEndEdge ? dx * 0.28 : dx;
      setDragOffset(resisted);
    }
  };

  const finishPointerInteraction = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    setIsDragging(false);

    if (start.moved) {
      suppressNextClickRef.current = true;
      setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 60);
    }

    if (!isZoomed && safeTotal > 1) {
      const dx = e.clientX - start.x;
      const elapsed = Math.max(1, Date.now() - start.time);
      const velocity = Math.abs(dx) / elapsed;
      const stageWidth = stageRef.current?.clientWidth || 360;
      const threshold = Math.min(80, stageWidth * 0.16);

      if (Math.abs(dx) > threshold || (velocity > 0.35 && Math.abs(dx) > 24)) {
        if (dx < 0 && currentIndex < safeTotal - 1) {
          goToIndex(currentIndex + 1);
        } else if (dx > 0 && currentIndex > 0) {
          goToIndex(currentIndex - 1);
        }
      }
    }

    setDragOffset(0);
    pointerStartRef.current = null;
  };

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressNextClickRef.current) return;
    if ((e.target as HTMLElement)?.closest('button')) return;

    // Click backdrop outside image closes lightbox; click image toggles zoom
    if ((e.target as HTMLElement)?.tagName === 'IMG') {
      setIsZoomed((prev) => {
        if (prev) setPanOffset({ x: 0, y: 0 });
        return !prev;
      });
    } else if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || safeTotal === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];
  const captionTitle = currentPhoto.label?.trim() || '';
  const captionBody = (currentPhoto.description || currentPhoto.caption || '').trim();
  const hasCaption = Boolean(captionTitle || captionBody);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={productTitle ? `Galeri layar penuh ${productTitle}` : 'Galeri Foto Produk'}
      className="fixed inset-0 z-[100] flex flex-col h-[100dvh] w-full bg-black/95 backdrop-blur-sm text-white select-none overflow-hidden"
    >
      {/* 1. Header Bar Atas (Terpisah penuh dari area foto) */}
      <header className="shrink-0 relative z-20 flex items-center justify-between gap-3 px-3 sm:px-6 h-14 border-b border-white/10 bg-black/80">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 min-w-[44px] h-11 px-2.5 sm:px-3.5 rounded-full text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          aria-label="Kembali ke detail produk"
          title="Kembali"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
          <span className="hidden sm:inline text-sm font-medium text-white/90">Kembali</span>
        </button>

        {/* Indikator Halaman Tengah (Contoh: "2 / 11") */}
        <div className="flex flex-col items-center min-w-0">
          <div
            className="text-sm sm:text-base font-semibold tracking-wide text-white tabular-nums"
            aria-live="polite"
          >
            {currentIndex + 1} / {safeTotal}
          </div>
          {productTitle && (
            <p className="hidden sm:block text-xs text-zinc-400 truncate max-w-md">
              {productTitle}
            </p>
          )}
        </div>

        {/* Kontrol Kanan: Zoom & Tutup (X) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              setIsZoomed((prev) => {
                if (prev) setPanOffset({ x: 0, y: 0 });
                return !prev;
              })
            }
            className="inline-flex items-center justify-center w-11 h-11 rounded-full text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
            aria-label={isZoomed ? 'Perkecil foto' : 'Perbesar foto'}
            title={isZoomed ? 'Reset Zoom' : 'Perbesar Foto'}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
            aria-label="Tutup galeri layar penuh"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Stage Foto Utama: Utuh (object-fit: contain), Terpusat, Swipe/Drag Halus */}
      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerInteraction}
        onPointerCancel={finishPointerInteraction}
        onClick={handleStageClick}
        style={{ touchAction: isZoomed ? 'none' : 'pan-y' }}
        className={`relative flex-1 min-h-0 w-full overflow-hidden flex items-center ${
          isZoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        {/* Track Horizontal Slide Multi-Foto */}
        <div
          className={`flex h-full w-full ${
            isDragging
              ? 'transition-none'
              : 'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
          }`}
          style={{
            transform: `translate3d(calc(-${currentIndex * 100}% + ${isZoomed ? 0 : dragOffset}px), 0, 0)`,
          }}
        >
          {photos.map((photo, idx) => {
            const isCurrent = idx === currentIndex;
            const hasFailed = Boolean(failedUrls[photo.url]);

            return (
              <div
                key={photo.id || `${photo.url}-${idx}`}
                className="w-full h-full shrink-0 flex items-center justify-center p-2 sm:p-6 overflow-hidden"
              >
                {hasFailed ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-400 text-center max-w-xs">
                    <ImageOff className="w-10 h-10 text-zinc-500" />
                    <p className="text-xs leading-relaxed">
                      Foto ke-{idx + 1} gagal dimuat. Geser untuk melihat foto lainnya.
                    </p>
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
                    style={
                      isCurrent && isZoomed
                        ? {
                            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(1.85)`,
                          }
                        : undefined
                    }
                    className={`max-w-full max-h-full w-auto h-auto object-contain select-none ${
                      isCurrent && isZoomed
                        ? 'cursor-zoom-out transition-transform duration-150'
                        : 'cursor-zoom-in transition-transform duration-300'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Tombol Panah Kiri (Alternatif untuk klik di desktop/mobile) */}
        {safeTotal > 1 && !isZoomed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="hidden sm:inline-flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/55 hover:bg-black/80 text-white border border-white/15 backdrop-blur-sm transition-all cursor-pointer active:scale-95"
            aria-label="Foto sebelumnya"
            title="Sebelumnya (Panah Kiri)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Tombol Panah Kanan (Alternatif untuk klik di desktop/mobile) */}
        {safeTotal > 1 && !isZoomed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="hidden sm:inline-flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/55 hover:bg-black/80 text-white border border-white/15 backdrop-blur-sm transition-all cursor-pointer active:scale-95"
            aria-label="Foto berikutnya"
            title="Berikutnya (Panah Kanan)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* 3. Area Bawah Terpisah: Dot Indicator, Thumbnail, & Caption (TIDAK menutupi foto) */}
      <footer className="shrink-0 relative z-20 bg-zinc-950/95 border-t border-white/10 px-3 sm:px-6 py-3 flex flex-col gap-2.5">
        {/* Dot Indicator (seperti galeri native mobile) */}
        {safeTotal > 1 && (
          <div className="flex items-center justify-center gap-2 py-0.5" role="tablist" aria-label="Pilih foto produk">
            {photos.map((photo, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={photo.id || idx}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Lihat foto ke-${idx + 1}`}
                  onClick={() => goToIndex(idx)}
                  className={`rounded-full transition-all duration-200 cursor-pointer ${
                    active
                      ? 'w-2.5 h-2.5 bg-white scale-110'
                      : 'w-2 h-2 bg-white/35 hover:bg-white/65'
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Panel Keterangan / Caption Khusus di Luar Area Foto */}
        {hasCaption && (
          <div className="mx-auto w-full max-w-2xl rounded-xl bg-zinc-900 border border-white/10 px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                {captionTitle && (
                  <p className="text-xs font-semibold text-sky-300 truncate">
                    {captionTitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCaptionCollapsed((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 py-0.5 px-1.5 rounded"
                aria-expanded={!isCaptionCollapsed}
              >
                <span>{isCaptionCollapsed ? 'Lihat ket.' : 'Sembunyikan'}</span>
                {isCaptionCollapsed ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {!isCaptionCollapsed && captionBody && (
              <p className="mt-1 text-xs sm:text-sm text-zinc-200 leading-relaxed">
                {captionBody}
              </p>
            )}
          </div>
        )}

        {/* Strip Thumbnail Mini Opsional (Desktop / Tablet untuk lompat cepat) */}
        {safeTotal > 1 && (
          <div className="hidden sm:flex items-center justify-center gap-2 overflow-x-auto pt-0.5 pb-1">
            {photos.map((photo, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={photo.id || `thumb-${idx}`}
                  type="button"
                  onClick={() => goToIndex(idx)}
                  aria-label={`Thumbnail foto ${idx + 1}`}
                  className={`relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    active
                      ? 'border-white scale-105 opacity-100'
                      : 'border-white/20 opacity-55 hover:opacity-90'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={`Thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </button>
              );
            })}
          </div>
        )}
      </footer>
    </div>
  );
};
