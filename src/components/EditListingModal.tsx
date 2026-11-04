import React, { useState, useEffect } from 'react';
import {
  X,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Flame,
  Tag,
  DollarSign,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Listing, Category, CATEGORIES } from '../types';

interface EditListingModalProps {
  isOpen: boolean;
  listing: Listing | null;
  onClose: () => void;
  onSave: (updatedListing: Listing) => Promise<void> | void;
}

export const EditListingModal: React.FC<EditListingModalProps> = ({
  isOpen,
  listing,
  onClose,
  onSave,
}) => {
  if (!isOpen || !listing) return null;

  const [title, setTitle] = useState(listing.title);
  const [category, setCategory] = useState<Category>(listing.category);
  const [location, setLocation] = useState(listing.location);
  const [normalPrice, setNormalPrice] = useState<number>(listing.normalPrice);
  const [sellingPrice, setSellingPrice] = useState<number>(listing.sellingPrice);
  const [condition, setCondition] = useState(listing.condition || '');
  const [urgentReason, setUrgentReason] = useState(listing.urgentReason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if listing prop updates
  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setCategory(listing.category);
      setLocation(listing.location);
      setNormalPrice(listing.normalPrice);
      setSellingPrice(listing.sellingPrice);
      setCondition(listing.condition || '');
      setUrgentReason(listing.urgentReason || '');
      setErrorMessage(null);
    }
  }, [listing]);

  // Kalkulasi diskon otomatis
  const discountPercentage =
    normalPrice > 0 && sellingPrice > 0 && normalPrice > sellingPrice
      ? Math.round(((normalPrice - sellingPrice) / normalPrice) * 100)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    // Validasi dasar
    if (!title.trim() || title.trim().length < 5) {
      setErrorMessage('Judul iklan wajib diisi minimal 5 karakter.');
      return;
    }
    if (!normalPrice || !sellingPrice || sellingPrice <= 0 || normalPrice <= 0) {
      setErrorMessage('Harga pasaran normal dan harga jual BU wajib diisi dengan benar.');
      return;
    }
    if (sellingPrice >= normalPrice) {
      setErrorMessage('Harga jual BU harus lebih murah dari harga pasaran normal.');
      return;
    }
    if (discountPercentage < 15) {
      setErrorMessage('JualRugi.my.id mensyaratkan diskon minimal 15% dari harga pasaran normal.');
      return;
    }
    if (!location.trim()) {
      setErrorMessage('Lokasi titik temu COD wajib diisi.');
      return;
    }
    if (!condition.trim() || condition.trim().length < 10) {
      setErrorMessage('Mohon jelaskan kondisi fisik & minus secara jujur (minimal 10 karakter).');
      return;
    }
    if (!urgentReason.trim() || urgentReason.trim().length < 10) {
      setErrorMessage('Mohon cantumkan alasan jual cepat / BU (minimal 10 karakter).');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedListing: Listing = {
        ...listing,
        title: title.trim(),
        category,
        location: location.trim(),
        normalPrice,
        sellingPrice,
        discountPercentage,
        condition: condition.trim(),
        urgentReason: urgentReason.trim(),
        status: 'in_moderation', // Reset status ke mode moderasi
      };

      await onSave(updatedListing);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan perubahan iklan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-sky-100 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-sky-500 text-white rounded-xl shadow-sm">
              <Pencil className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-sky-950">
                Edit Iklan Butuh Uang
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Perbarui rincian harga BU, minus kondisi, atau lokasi COD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Tutup Form Edit"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Judul Iklan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-600" />
              Judul Iklan Barang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: iPhone 13 128GB Midnight Ex-iBox Mulus Fullset"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition font-medium text-slate-800"
              required
            />
          </div>

          {/* Baris Kategori & Lokasi COD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Kategori */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition bg-white font-medium text-slate-800"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Lokasi COD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Lokasi COD <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Jakarta Selatan (Blok M / Gandaria)"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition font-medium text-slate-800"
                required
              />
            </div>
          </div>

          {/* Kotak Harga Pasaran vs Harga Jual BU */}
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-sky-600" />
                Kalkulasi Diskon Jual Rugi
              </span>
              {discountPercentage > 0 && (
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    discountPercentage >= 15
                      ? 'bg-red-500 text-white shadow-xs'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Potongan: {discountPercentage}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Harga Pasaran Normal (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={normalPrice || ''}
                  onChange={(e) => setNormalPrice(Number(e.target.value) || 0)}
                  placeholder="10500000"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none font-bold text-slate-700"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Harga Jual Cepat BU (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={sellingPrice || ''}
                  onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                  placeholder="6200000"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none font-black text-sky-900"
                  required
                />
              </div>
            </div>

            {discountPercentage > 0 && discountPercentage < 15 && (
              <p className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Diskon saat ini baru {discountPercentage}%. Naikkan diskon ke minimal 15% agar sesuai syarat JualRugi.
              </p>
            )}
          </div>

          {/* Kejujuran Kondisi & Minus Fisik */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                Kejujuran Kondisi & Minus Fisik <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] font-bold text-sky-600">Transparansi Wajib</span>
            </div>
            <textarea
              rows={3}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Sebutkan kondisi fisik, kesehatan baterai, fungsi tombol, kelengkapan dus/nota, atau lecet halus pemakaian secara jujur."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition font-medium text-slate-800 resize-none leading-relaxed"
              required
            />
          </div>

          {/* Alasan Jual Rugi / Butuh Uang Mendesak */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              Alasan Jual Rugi / Butuh Uang (BU) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={urgentReason}
              onChange={(e) => setUrgentReason(e.target.value)}
              placeholder="Contoh: Butuh uang darurat untuk biaya pengobatan keluarga / sewa ruko."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition font-medium text-slate-800 resize-none leading-relaxed"
              required
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-sky-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-white font-bold text-xs sm:text-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-sky-500/25 flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:bg-sky-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
