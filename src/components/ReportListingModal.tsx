import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Send,
  CheckCircle2,
  Lock,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Listing, UserProfile } from '../types';
import {
  AD_REPORT_REASONS,
  AdReportReason,
  createAdReport,
  AdReport,
} from '../services/reportService';

const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

interface ReportListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  currentUser?: UserProfile;
  onReportSubmitted?: (report: AdReport) => void;
}

export const ReportListingModal: React.FC<ReportListingModalProps> = ({
  isOpen,
  onClose,
  listing,
  currentUser,
  onReportSubmitted,
}) => {
  const [selectedReason, setSelectedReason] = useState<AdReportReason>('dp_scam');
  const [notes, setNotes] = useState('');
  const [reporterName, setReporterName] = useState(currentUser?.name || '');
  const [reporterContact, setReporterContact] = useState(
    currentUser?.phone || currentUser?.whatsapp || currentUser?.email || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!notes.trim() && selectedReason === 'other') {
      setErrorMessage('Mohon berikan rincian singkat mengenai pelanggaran iklan ini.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newReport = createAdReport({
        listingId: listing.id,
        listingTitle: listing.title,
        listingPrice: listing.sellingPrice,
        listingImageUrl: listing.imageUrl,
        listingLocation: listing.location,
        sellerId: listing.seller.id,
        sellerName: listing.seller.name,
        sellerWhatsapp: listing.seller.phoneMasked || '',
        reporterName: reporterName || currentUser?.name || 'Pembeli Peduli',
        reporterContact: reporterContact || currentUser?.phone || currentUser?.email || '-',
        reporterUserId: currentUser?.id,
        reason: selectedReason,
        notes,
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      if (onReportSubmitted) {
        onReportSubmitted(newReport);
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2200);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengirim laporan.');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-rose-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 via-white to-amber-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-rose-950">
                Laporkan Iklan Ini
              </h3>
              <p className="text-[11px] text-slate-500">
                Terhubung langsung ke Tim Pengawasan Admin JualRugi.my.id
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-black text-lg text-slate-900">
                Laporan Berhasil Terkirim!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Terima kasih atas bantuan Anda menjaga keamanan ekosistem COD JualRugi.
                Laporan Anda telah diteruskan ke <strong>Dashboard Admin</strong> untuk penindakan segera.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 text-xs">
            {/* Info Produk Yang Dilaporkan */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Produk Yang Dilaporkan:
                </span>
                <h4 className="font-bold text-xs text-slate-900 truncate" title={listing.title}>
                  {listing.title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                  <span className="font-extrabold text-sky-900">
                    {formatRupiah(listing.sellingPrice)}
                  </span>
                  <span className="text-slate-400">• Penjual: {listing.seller.name}</span>
                </div>
              </div>
            </div>

            {/* Warning SOP Keamanan */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Perlindungan Pembeli:</strong> Di JualRugi.my.id, penjual <strong>dilarang keras meminta transfer DP</strong> sebelum Anda memeriksa fisik barang saat COD tatap muka.
              </div>
            </div>

            {/* Pilihan Kategori Pelanggaran */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 block text-xs">
                Pilih Alasan / Indikasi Pelanggaran: <span className="text-rose-500">*</span>
              </label>

              <div className="space-y-2">
                {AD_REPORT_REASONS.map((opt) => {
                  const isSelected = selectedReason === opt.id;
                  return (
                    <label
                      key={opt.id}
                      onClick={() => setSelectedReason(opt.id)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-1 ring-rose-300'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={isSelected}
                        onChange={() => setSelectedReason(opt.id)}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div className="grow">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${isSelected ? 'text-rose-950' : 'text-slate-800'}`}>
                            {opt.label}
                          </span>
                          {opt.severity === 'high' && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700">
                              Kritis
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Catatan Kronologi / Bukti Tambahan */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block text-xs flex items-center justify-between">
                <span>Catatan Kronologi / Bukti Singkat:</span>
                <span className="text-[10px] text-slate-400 font-normal">Opsional tapi disarankan</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Penjual memaksa transfer uang tanda jadi Rp 100.000 ke rekening BCA, padahal aturan wajib COD tatap muka."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Kontak Pelapor (Opsional / Terisi otomatis jika login) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Anda (Pelapor):
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Kontak WA / Email Pelapor:
                </label>
                <input
                  type="text"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="0812xxxx / email@..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs text-slate-800"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer transition text-center"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                {isSubmitting ? (
                  <span>Mengirim Laporan...</span>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Kirim Laporan ke Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
