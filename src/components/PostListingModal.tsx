import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertOctagon,
  Flame,
  CheckCircle2,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { Category, CATEGORIES, Listing, UserProfile } from '../types';
import { DEMO_PRESET_IMAGES } from '../data/initialData';

interface PostListingModalProps {
  onClose: () => void;
  currentUser: UserProfile;
  onListingApproved: (newListing: Listing) => void;
}

export const PostListingModal: React.FC<PostListingModalProps> = ({
  onClose,
  currentUser,
  onListingApproved,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Smartphone & Gadget');
  const [location, setLocation] = useState('Jakarta Selatan');
  const [normalPrice, setNormalPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [condition, setCondition] = useState('');
  const [urgentReason, setUrgentReason] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState('');
  const [rejectionNotice, setRejectionNotice] = useState<string | null>(null);

  const numNormal = Number(normalPrice) || 0;
  const numSelling = Number(sellingPrice) || 0;
  const discountPercentage =
    numNormal > 0 && numSelling > 0 && numNormal > numSelling
      ? Math.round(((numNormal - numSelling) / numNormal) * 100)
      : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImageBase64(result);
        setImagePreviewUrl(result);
        setRejectionNotice(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadPreset = (preset: (typeof DEMO_PRESET_IMAGES)[0]) => {
    setTitle(preset.sampleTitle);
    setCategory(preset.category);
    setNormalPrice(preset.normal);
    setSellingPrice(preset.selling);
    setCondition(preset.condition);
    setUrgentReason(preset.urgentReason);
    setImagePreviewUrl(preset.url);

    fetch(preset.url)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        setImageBase64(preset.url);
      });

    setRejectionNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRejectionNotice(null);

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
    if (!imagePreviewUrl) {
      alert('Mohon unggah foto fisik barang atau pilih preset contoh.');
      return;
    }

    setIsVerifying(true);
    setVerificationStep('🔍 Menghubungkan ke Gemini AI Gatekeeper...');

    try {
      setTimeout(() => {
        setVerificationStep('📸 Menginspeksi otentisitas foto fisik (bukan brosur/flyer)...');
      }, 700);

      setTimeout(() => {
        setVerificationStep('📊 Menghitung kewajaran harga jual rugi & deskripsi minus...');
      }, 1500);

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
          imageBase64: imageBase64 || imagePreviewUrl,
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
          imageUrl: imagePreviewUrl,
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
            'Iklan tidak lolos verifikasi AI. Foto terdeteksi brosur marketing komersial atau harga tidak mencerminkan jual rugi darurat.'
        );
      }
    } catch (err) {
      console.error(err);
      setIsVerifying(false);
      setRejectionNotice('Gagal menghubungi engine verifikasi AI. Silakan coba kembali.');
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
              <p className="text-[11px] text-slate-500">Verifikasi Gatekeeper AI Multimodal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isVerifying}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-sky-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto grow p-5 space-y-4 text-xs bg-[#f0f9ff]/40">
          {/* Rejection Alert Box */}
          {rejectionNotice && (
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-500 text-red-950">
              <div className="flex items-start gap-2.5">
                <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800 text-sm">
                    Verifikasi AI Ditolak:
                  </h4>
                  <p className="mt-1 text-xs text-red-900 leading-relaxed font-medium">
                    {rejectionNotice}
                  </p>
                  <p className="mt-2 text-[11px] text-red-700">
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

          {/* Image Upload Area */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Foto Fisik Barang (Wajib Asli, Bukan Brosur) *</span>
              {imagePreviewUrl && (
                <span className="text-[10px] text-sky-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Foto Terpilih
                </span>
              )}
            </label>

            {imagePreviewUrl ? (
              <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-sky-50 border border-sky-200 group">
                <img
                  src={imagePreviewUrl}
                  alt="Preview Barang"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-sky-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  <label className="py-1.5 px-3 rounded-xl bg-sky-500 text-white font-bold text-xs cursor-pointer hover:bg-sky-600 shadow-sm">
                    Ganti Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setImageBase64('');
                      setImagePreviewUrl('');
                    }}
                    className="py-1.5 px-3 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-sky-200 hover:border-sky-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-white hover:bg-sky-50/50">
                <div className="p-3 rounded-full bg-sky-100 text-sky-600">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="font-bold text-sky-950">
                    Klik untuk Unggah Foto dari Kamera / Galeri
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Format JPG, PNG, WEBP (Maksimal 10MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
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

          {/* Strictly 4 Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Kategori (4 Kategori) *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 focus:border-sky-500 text-slate-900 text-xs outline-none cursor-pointer shadow-xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Location (City/Regency) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Lokasi COD (Kota/Kabupaten) *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Jakarta Selatan, Bekasi, Bandung"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-sky-200 focus:border-sky-500 text-slate-900 placeholder-slate-400 text-xs outline-none shadow-xs"
              />
            </div>
          </div>

          {/* Normal Price & Urgent Selling Price with Auto-Calculated Discount */}
          <div className="bg-white p-3.5 rounded-2xl border border-sky-100 shadow-xs space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Harga Pasaran Normal (Rp) *</label>
                <input
                  type="number"
                  required
                  min={10000}
                  placeholder="Rp 10.000.000"
                  value={normalPrice}
                  onChange={(e) =>
                    setNormalPrice(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-800 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sky-700">Harga Jual BU (Rp) *</label>
                <input
                  type="number"
                  required
                  min={10000}
                  placeholder="Rp 6.500.000"
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-300 text-sky-950 font-black text-xs outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Live Discount Gauge */}
            <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-sky-600 fill-sky-600 animate-pulse" />
                <span className="font-bold text-slate-700">Kalkulasi Diskon Otomatis:</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                    discountPercentage >= 15
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  Diskon {discountPercentage}% BU
                </span>
                {discountPercentage >= 15 ? (
                  <span className="text-[10px] text-sky-700 font-bold">
                    ✓ Syarat BU Terpenuhi
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 font-bold">
                    Min. 15% diskon
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Condition & Minus Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              Deskripsi Kondisi & Minus Barang *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Jelaskan kondisi sejujurnya: kelengkapan (fullset/batangan), kondisi fisik, lecet pemakaian, fungsi tombol/layar/mesin..."
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 focus:border-sky-500 text-slate-900 placeholder-slate-400 text-xs outline-none resize-none shadow-xs"
            />
          </div>

          {/* Urgent Reason */}
          <div className="space-y-1">
            <label className="font-bold text-sky-700">
              Alasan Jual Rugi / Butuh Uang (BU)
            </label>
            <input
              type="text"
              placeholder="Contoh: Butuh uang nebus obat, bayar kuliah, sewa kos hari ini"
              value={urgentReason}
              onChange={(e) => setUrgentReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 focus:border-sky-500 text-slate-900 placeholder-slate-400 text-xs outline-none shadow-xs"
            />
          </div>

          {/* Verification Scanning Overlay */}
          {isVerifying && (
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-300 space-y-2">
              <div className="flex items-center gap-2 text-sky-950 font-bold text-sm">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                <span>Memproses Gatekeeper AI Multimodal...</span>
              </div>
              <p className="text-xs text-sky-800 font-mono animate-pulse">
                {verificationStep}
              </p>
              <div className="w-full bg-sky-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full w-3/4 animate-pulse" />
              </div>
            </div>
          )}

          {/* Action Button - Sky Blue */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isVerifying}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide transition shadow-md shadow-sky-500/25 cursor-pointer flex items-center justify-center gap-2 ${
                isVerifying
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-600 text-white active:scale-98'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isVerifying ? 'Sedang Diverifikasi AI...' : 'Tayangkan Iklan (Verifikasi AI)'}</span>
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-2">
              🛡️ Semua iklan wajib melewati kurasi ketat AI untuk mencegah penipuan foto katalog & harga palsu.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
