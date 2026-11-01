import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  AlertCircle,
  Plus,
  Trash2,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { ProductPhoto } from '../../types';

/**
 * =========================================================================
 * CARA INTEGRASI DATA ARRAY FORM UPLOAD FOTO (JualRugi.id)
 * =========================================================================
 * Modul ini menerima state `photos` bertipe `ProductPhoto[]` dan fungsi `onChange`.
 *
 * Contoh penggunaan pada form produk:
 *
 * const [productPhotos, setProductPhotos] = useState<ProductPhoto[]>([
 *   {
 *     id: 'p1',
 *     url: 'https://...',
 *     caption: 'Tampak depan mulus'
 *   }
 * ]);
 *
 * <PhotoUploadManager
 *   photos={productPhotos}
 *   onChange={setProductPhotos}
 *   maxPhotos={6}
 *   maxSizeMB={5}
 * />
 *
 * Data array foto yang dihasilkan siap dikirimkan ke backend atau disimpan ke database!
 * =========================================================================
 */

export interface PhotoUploadManagerProps {
  photos: ProductPhoto[];
  onChange: (photos: ProductPhoto[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number; // Default: 5MB
  onError?: (errorMessage: string) => void;
  permissionGranted?: boolean;
  onRequestPermission?: () => void;
}

export const PhotoUploadManager: React.FC<PhotoUploadManagerProps> = ({
  photos,
  onChange,
  maxPhotos = 6,
  maxSizeMB = 5,
  onError,
  permissionGranted = true,
  onRequestPermission,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    if (onError) onError(msg);
    setTimeout(() => {
      setErrorMessage((current) => (current === msg ? null : current));
    }, 5000);
  };

  const processFiles = (files: FileList | File[]) => {
    setErrorMessage(null);
    const fileList = Array.from(files);

    if (fileList.length === 0) return;

    // 1. Cek batasan total foto maksimal 6
    const availableSlots = maxPhotos - photos.length;
    if (availableSlots <= 0) {
      triggerError(`Maksimal hanya dapat mengunggah ${maxPhotos} foto produk.`);
      return;
    }

    const filesToProcess = fileList.slice(0, availableSlots);
    if (fileList.length > availableSlots) {
      triggerError(
        `Hanya ${availableSlots} foto yang ditambahkan karena batasan maksimal ${maxPhotos} foto.`
      );
    }

    const newPhotos: ProductPhoto[] = [];

    filesToProcess.forEach((file) => {
      // 2. Validasi format file (Hanya JPG, PNG, WebP)
      if (!allowedFormats.includes(file.type)) {
        triggerError(
          `Format berkas "${file.name}" tidak didukung! Harap unggah format JPG, PNG, atau WebP.`
        );
        return;
      }

      // 3. Validasi ukuran file (Maksimal maxSizeMB)
      if (file.size > maxSizeBytes) {
        triggerError(
          `Ukuran berkas "${file.name}" terlalu besar (${(file.size / (1024 * 1024)).toFixed(
            1
          )}MB). Maksimal ukuran file adalah ${maxSizeMB}MB.`
        );
        return;
      }

      // Baca file sebagai Data URL
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const photoItem: ProductPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          url: result,
          caption: '',
          file,
        };

        newPhotos.push(photoItem);

        // Setelah semua file yang valid selesai diproses, update state
        if (newPhotos.length > 0) {
          onChange([...photos, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset file input agar bisa upload file yang sama jika dihapus
    e.target.value = '';
  };

  // Hapus foto tertentu
  const handleRemovePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  // Update caption teks untuk foto tertentu
  const handleCaptionChange = (id: string, captionText: string) => {
    onChange(
      photos.map((p) => (p.id === id ? { ...p, caption: captionText } : p))
    );
  };

  const canUploadMore = photos.length < maxPhotos;

  return (
    <div className="w-full space-y-3.5">
      {/* Header Form Upload & Indikator Kuota Foto */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-sky-600" />
          <span>Foto Fisik Produk Asli</span>
          <span className="text-[11px] font-normal text-slate-500">
            (Wajib foto riil barang)
          </span>
        </label>
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
            photos.length >= maxPhotos
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-sky-50 text-sky-700 border-sky-200'
          }`}
        >
          {photos.length} / {maxPhotos} Foto
        </span>
      </div>

      {/* Alert Error Validasi File */}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Area Drag & Drop / Tombol Upload Utama (tampil jika kuota belum penuh) */}
      {canUploadMore && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            if (!permissionGranted && onRequestPermission) {
              onRequestPermission();
            } else {
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-sky-500 bg-sky-50 scale-101'
              : 'border-sky-200 hover:border-sky-400 bg-sky-50/40 hover:bg-sky-50/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-sky-950">
                Tarik foto ke sini atau <span className="text-sky-600 underline">pilih berkas</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Format: <strong>JPG, PNG, WebP</strong> • Maksimal <strong>{maxSizeMB}MB</strong> per foto
              </p>
            </div>

            <span className="text-[10px] font-semibold text-sky-700 bg-sky-100/70 px-2.5 py-1 rounded-full">
              Tersisa {maxPhotos - photos.length} slot foto lagi
            </span>
          </div>
        </div>
      )}

      {/* Daftar Preview Foto yang Diunggah dengan Input Caption & Tombol Hapus */}
      {photos.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold text-slate-600">
            Preview Foto & Keterangan Sudut (Opsional):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative bg-white rounded-2xl border border-sky-100 p-2.5 shadow-xs hover:shadow-md transition-shadow flex gap-3 items-start"
              >
                {/* Thumbnail Gambar */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-sky-100">
                  <img
                    src={photo.url}
                    alt={photo.caption || `Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Badge Nomor Urut */}
                  <span
                    className={`absolute bottom-1 left-1 text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      index === 0
                        ? 'bg-amber-400 text-amber-950 border border-amber-500'
                        : 'bg-black/70 text-white'
                    }`}
                  >
                    {index === 0 ? 'Foto Utama' : `#${index + 1}`}
                  </span>
                </div>

                {/* Kolom Input Caption Teks & Tombol Hapus */}
                <div className="grow min-w-0 flex flex-col justify-between h-full space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-950">
                      {index === 0 ? 'Foto Sampul Produk' : `Foto Sudut #${index + 1}`}
                    </span>

                    {/* Tombol Hapus Masing-Masing Preview Foto */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus foto ini"
                      aria-label="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Input Caption Teks (Opsional) */}
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium block mb-0.5">
                      Caption / Keterangan Sudut:
                    </label>
                    <input
                      type="text"
                      value={photo.caption || ''}
                      onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                      placeholder="Misal: Tampak depan, lecet di bezel..."
                      maxLength={100}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-sky-50/50 border border-sky-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-400 text-slate-800 placeholder:text-slate-400 transition"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
