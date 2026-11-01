import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertOctagon,
  Flame,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Category, CATEGORIES, Listing, UserProfile, ProductPhoto, MonetizationPackage } from '../types';
import { DEMO_PRESET_IMAGES } from '../data/initialData';
import { PhotoUploadManager } from './gallery/PhotoUploadManager';
import { QuotaExceededModal } from './QuotaExceededModal';
import { CameraGalleryPermissionModal } from './CameraGalleryPermissionModal';

interface PostListingModalProps {
  onClose: () => void;
  currentUser: UserProfile;
  onListingApproved: (newListing: Listing) => void;
  onOpenMayarPromotion?: (packageType: MonetizationPackage) => void;
  onUpdatePermissions?: (perms: { cameraGalleryGranted: boolean }) => void;
}

export const PostListingModal: React.FC<PostListingModalProps> = ({
  onClose,
  currentUser,
  onListingApproved,
  onOpenMayarPromotion,
  onUpdatePermissions,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Smartphone & Gadget');
  const [location, setLocation] = useState('Jakarta Selatan');
  const [normalPrice, setNormalPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [condition, setCondition] = useState('');
  const [urgentReason, setUrgentReason] = useState('');

  // Kuota & Permission States
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(
    Boolean(currentUser.permissions?.cameraGalleryGranted)
  );

  // Sistem Upload & Manajemen Foto (Maksimal 6 Foto dengan Caption)
  const [photos, setPhotos] = useState<ProductPhoto[]>([]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState('');
  const [rejectionNotice, setRejectionNotice] = useState<string | null>(null);

  const numNormal = Number(normalPrice) || 0;
  const numSelling = Number(sellingPrice) || 0;
  const discountPercentage =
    numNormal > 0 && numSelling > 0 && numNormal > numSelling
      ? Math.round(((numNormal - numSelling) / numNormal) * 100)
      : 0;

  const loadPreset = (preset: (typeof DEMO_PRESET_IMAGES)[0]) => {
    setTitle(preset.sampleTitle);
    setCategory(preset.category);
    setNormalPrice(preset.normal);
    setSellingPrice(preset.selling);
    setCondition(preset.condition);
    setUrgentReason(preset.urgentReason);

    // Memuat contoh foto multi-sudut dengan caption yang relevan
    const presetPhotos: ProductPhoto[] = [
      {
        id: `preset-${Date.now()}-1`,
        url: preset.url,
        caption: `Tampak depan: ${preset.sampleTitle}`,
      },
      {
        id: `preset-${Date.now()}-2`,
        url: preset.url,
        caption: 'Tampak sudut samping dan kondisi kelengkapan',
      },
    ];

    setPhotos(presetPhotos);
    setRejectionNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRejectionNotice(null);

    // 1. Validasi Aturan Kuota Iklan (User Baru Kuota 1x Gratis, Berbayar via Mayar)
    if (currentUser.listingQuota <= 0) {
      setIsQuotaModalOpen(true);
      return;
    }

    if (!title.trim()) {
      alert('Mohon isi judul iklan barang Anda.');
      return;
    }
    if (!normalPrice || !sellingPrice) {
      alert('Mohon isi harga pasaran normal dan harga jual BU.');
      return;
    }
    if (discountPercentage < 15) {
      alert('JualRugi.id mengkhususkan iklan Butuh Uang (BU) dengan diskon minimal 15%.');
      return;
    }
    if (photos.length === 0) {
      alert('Mohon unggah minimal 1 foto fisik asli barang Anda (maksimal 6 foto).');
      return;
    }

    setIsVerifying(true);
    setVerificationStep('🔍 Iklan Anda sedang dimoderasi...');

    try {
      setTimeout(() => {
        setVerificationStep('📸 Memeriksa otentisitas foto fisik barang...');
      }, 700);

      setTimeout(() => {
        setVerificationStep('📊 Memverifikasi kewajaran harga jual rugi & deskripsi minus...');
      }, 1500);

      const primaryPhoto = photos[0];

      const response = await fetch('/api/verify-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          location,
          normalPrice: Number(normalPrice),
          sellingPrice: Number(sellingPrice),
          condition: condition || 'Normal pemakaian, minus lecet pemakaian fisik.',
          urgentReason: urgentReason || 'Butuh dana darurat segera.',
          imageBase64: primaryPhoto.url,
        }),
      });

      const result = await response.json();
      setIsVerifying(false);

      if (result.approved) {
        const newListing: Listing = {
          id: `bu-${Date.now()}`,
          title: title.trim(),
          category,
          normalPrice: Number(normalPrice),
          sellingPrice: Number(sellingPrice),
          discountPercentage: result.discount_percentage || discountPercentage,
          location,
          condition: condition.trim() || 'Unit berfungsi normal, minus kosmetik pemakaian.',
          urgentReason: urgentReason.trim() || 'Butuh uang segera untuk keperluan mendesak.',
          imageUrl: primaryPhoto.url,
          photos,
          images: photos.map((p) => p.url),
          photoAngles: photos.map((p, idx) => ({
            url: p.url,
            label: p.caption || (idx === 0 ? 'Tampak Depan' : `Sudut #${idx + 1}`),
            description: p.caption,
          })),
          isSuperBU: false,
          createdAt: new Date().toISOString(),
          seller: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            location,
            codVerified: true,
            rating: 5.0,
            dealsCompleted: 1,
            joinedDate: 'Hari Ini',
            phoneMasked: currentUser.phone || '0812-XXXX-XXXX',
          },
          aiVerified: true,
          aiVerificationReason: result.reason,
          views: 1,
          savedCount: 0,
        };

        onListingApproved(newListing);
        onClose();
      } else {
        setRejectionNotice(
          result.reason ||
            'Iklan belum lolos moderasi. Foto terdeteksi materi promosi komersial atau harga belum mencerminkan jual rugi darurat.'
        );
      }
    } catch (err) {
      console.error(err);
      setIsVerifying(false);
      setRejectionNotice('Gagal memproses moderasi iklan. Silakan coba kembali.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/35 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-sky-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
              BU
            </div>
            <div>
              <h2 className="text-base font-extrabold text-sky-950">Pasang Iklan Jual Rugi</h2>
              <p className="text-[11px] text-slate-500">Moderasi Kualitas & Otentisitas Produk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-sky-50 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto grow p-5 space-y-4 text-xs bg-[#f0f9ff]/40">
          {/* Kuota Status Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              currentUser.listingQuota > 0
                ? 'bg-sky-50 border-sky-200 text-sky-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentUser.listingQuota > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <div>
                <span className="font-extrabold text-xs block">
                  {currentUser.listingQuota > 0
                    ? `Sisa Kuota: ${currentUser.listingQuota} Slot Iklan Tersedia`
                    : 'Batas Kuota Iklan Anda Telah Habis'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {!currentUser.freeListingUsed
                    ? '🎁 Termasuk 1x Kuota Iklan Pertama Gratis untuk Member Baru'
                    : currentUser.listingQuota > 0
                    ? '💳 Kuota listing aktif siap ditayangkan'
                    : 'Beli fitur promosi untuk membuka slot iklan baru'}
                </span>
              </div>
            </div>

            {currentUser.listingQuota <= 0 && (
              <button
                type="button"
                onClick={() => setIsQuotaModalOpen(true)}
                className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] shrink-0 shadow-xs cursor-pointer"
              >
                Buka Slot (+1)
              </button>
            )}
          </div>

          {/* Rejection Alert Box */}
          {rejectionNotice && (
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-500 text-red-950">
              <div className="flex items-start gap-2.5">
                <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-red-900 text-xs">Iklan Ditolak Oleh Sistem</h4>
                  <p className="text-[11px] leading-relaxed text-red-800">{rejectionNotice}</p>
                  <p className="text-[10px] text-slate-500 pt-1">
                    💡 <em>Tips:</em> Unggah foto fisik barang asli dari kamera Anda (bukan brosur/flyer katalog Canva), dan pastikan potongan harga minimal 15% dari pasaran wajar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Demo Preset Selector */}
          <div className="bg-white p-3.5 rounded-2xl border border-sky-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-950 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Coba Contoh Cepat (Preset Demo):
              </span>
              <span className="text-[10px] text-slate-400">1-Klik isi otomatis</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_PRESET_IMAGES.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => loadPreset(preset)}
                  className={`p-2.5 rounded-xl text-left border transition text-[11px] font-semibold cursor-pointer active:scale-95 ${
                    preset.type === 'flyer'
                      ? 'bg-red-50/60 hover:bg-red-100/70 border-red-200 text-red-900'
                      : 'bg-sky-50/70 hover:bg-sky-100 border-sky-200 text-sky-950'
                  }`}
                >
                  <span className="block truncate">{preset.label}</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">
                    {preset.type === 'flyer' ? '⚠️ Uji Penolakan Flyer' : '✅ Uji Lolos Fisik Asli'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Sistem Upload & Manajemen Foto (Maksimal 6 foto, validasi JPG/PNG/WebP, caption, tombol hapus) */}
          <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
            <PhotoUploadManager
              photos={photos}
              onChange={setPhotos}
              maxPhotos={6}
              maxSizeMB={5}
              onError={(err) => setRejectionNotice(err)}
              permissionGranted={cameraPermissionGranted}
              onRequestPermission={() => setIsCameraModalOpen(true)}
            />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Judul Iklan *</label>
            <input
              type="text"
              required
              placeholder="Contoh: iPhone 14 Pro 128GB Mulus Fullset - BU Beli Susu Anak"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-900 placeholder-slate-400 text-xs outline-none shadow-xs"
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Kategori *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-900 text-xs outline-none shadow-xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Lokasi COD *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Jakarta Selatan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-900 text-xs outline-none shadow-xs"
              />
            </div>
          </div>

          {/* Pricing & Discount */}
          <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-sky-100 shadow-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Harga Pasaran Normal (Rp) *</label>
              <input
                type="number"
                required
                min={10000}
                placeholder="Contoh: 14500000"
                value={normalPrice}
                onChange={(e) => setNormalPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 text-xs font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Harga Jual Cepat BU (Rp) *</label>
              <input
                type="number"
                required
                min={10000}
                placeholder="Contoh: 8900000"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 text-xs font-bold text-sky-900"
              />
            </div>

            <div className="col-span-2 pt-2 border-t border-sky-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame
                  className={`w-4 h-4 ${
                    discountPercentage >= 15 ? 'text-red-500 animate-pulse' : 'text-slate-300'
                  }`}
                />
                <span className="font-extrabold text-xs text-slate-800">
                  Potongan: {discountPercentage}%
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  discountPercentage >= 15
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {discountPercentage >= 15
                  ? '✅ Memenuhi Syarat Jual Rugi (Min 15%)'
                  : '⚠️ Diskon Kurang Dari 15%'}
              </span>
            </div>
          </div>

          {/* Condition and Physical Minus (Transparency Requirement) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Kejujuran Kondisi & Minus Fisik *</span>
              <span className="text-[10px] text-sky-700 font-semibold">
                Transparansi Wajib
              </span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Jelaskan kondisi fisik riil & kekurangan (contoh: Layar mulus 100%, ada lecet halus di bezel bawah dekat port charger)."
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-900 placeholder-slate-400 text-xs outline-none shadow-xs"
            />
          </div>

          {/* Urgent Reason */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>Alasan Jual Rugi / Butuh Uang Mendesak (BU) *</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Ceritakan alasan darurat Anda (contoh: Butuh uang tunai hari ini buat nebus obat & susu anak)."
              value={urgentReason}
              onChange={(e) => setUrgentReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-900 placeholder-slate-400 text-xs outline-none shadow-xs"
            />
          </div>

          {/* Moderation Note */}
          <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
            <p className="text-[11px] text-sky-950 leading-relaxed font-medium">
              Iklan akan dimoderasi secara teliti untuk memastikan foto fisik asli barang dan harga benar-benar murah.
            </p>
          </div>

          {/* Verification Progress Modal Overlay */}
          {isVerifying && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-md mb-4 animate-bounce">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
              </div>
              <h3 className="font-extrabold text-base text-sky-950">
                Iklan Anda Sedang Dimoderasi
              </h3>
              <p className="text-xs text-sky-700 font-semibold mt-1">
                {verificationStep}
              </p>
              <div className="w-48 bg-sky-100 rounded-full h-1.5 mt-4 overflow-hidden">
                <div className="bg-sky-500 h-full w-2/3 animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="w-1/3 py-2.5 rounded-xl border border-sky-200 text-slate-600 font-bold hover:bg-sky-50 cursor-pointer transition text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="w-2/3 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold shadow-md shadow-sky-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition text-xs"
            >
              <span>Verifikasi & Tayangkan Iklan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sub-Modal: Batas Kuota Terpakai (Monetisasi Mayar) */}
      <QuotaExceededModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        currentUser={currentUser}
        onSelectPromotion={(plan) => {
          setIsQuotaModalOpen(false);
          if (onOpenMayarPromotion) {
            onOpenMayarPromotion(plan);
          }
        }}
      />

      {/* Sub-Modal: Izin Galeri & Kamera */}
      <CameraGalleryPermissionModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onGrantPermission={() => {
          setCameraPermissionGranted(true);
          if (onUpdatePermissions) {
            onUpdatePermissions({ cameraGalleryGranted: true });
          }
        }}
      />
    </div>
  );
};
