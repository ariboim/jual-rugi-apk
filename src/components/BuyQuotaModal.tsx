import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Copy,
  Check,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  QUOTA_SLOT_PACKAGES,
  QuotaSlotPackage,
  WA_ADMIN_PHONE,
  generateQuotaWhatsAppMessage,
  buildQuotaWhatsAppConfirmationUrl,
} from '../data/mayarConfig';
import { WhatsAppIcon } from './ListingCard';

interface BuyQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSimulateAdminApproval?: (amount: number) => void;
}

export const BuyQuotaModal: React.FC<BuyQuotaModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSimulateAdminApproval,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<QuotaSlotPackage>(
    QUOTA_SLOT_PACKAGES[1] // Default to 5 Kuota (Popular)
  );
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedRekBca, setCopiedRekBca] = useState(false);

  if (!isOpen) return null;

  const userName = currentUser.name || 'Pengguna JualRugi';
  const userId = currentUser.id || 'buyer-rian';
  const kuotaLabel = selectedPackage.label; // e.g. "5 Kuota Iklan"

  // Hitung sisa hari dari cooldown 45 hari (jika ada)
  let daysLeft = 45;
  if (currentUser.freeQuotaAvailableAt) {
    const diffMs = new Date(currentUser.freeQuotaAvailableAt).getTime() - Date.now();
    daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const rawMessage = generateQuotaWhatsAppMessage(userName, userId, kuotaLabel);
  const waUrl = buildQuotaWhatsAppConfirmationUrl(userName, userId, kuotaLabel);

  const handleCopyMessage = () => {
    navigator.clipboard?.writeText(rawMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleCopyBca = () => {
    navigator.clipboard?.writeText('883012345678');
    setCopiedRekBca(true);
    setTimeout(() => setCopiedRekBca(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto p-5 sm:p-6 text-slate-800">
        {/* Tombol Close */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          title="Tutup"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Modal */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 border-2 border-sky-300 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
            Beli Slot Kuota Iklan
          </span>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-2">
            Pasang Iklan Langsung Tanpa Menunggu
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Sesuai aturan, iklan yang terjual (sold) <strong>tidak menambah kuota</strong>. Kuota gratis memerlukan waktu tunggu <strong>45 hari</strong>.
          </p>
        </div>

        {/* 45 Days Cooldown Notice Box */}
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300/80 mb-4 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-amber-950">
            <span className="font-extrabold block text-amber-900">
              ⏳ Periode Tunggu Kuota Gratis: Tersisa {daysLeft} Hari Lagi
            </span>
            Jika tidak ingin menunggu 45 hari, silakan pilih salah satu paket slot kuota di bawah ini untuk langsung pasang iklan baru.
          </div>
        </div>

        {/* Pilihan 3 Paket Kuota Iklan */}
        <div className="space-y-2.5 mb-4">
          {QUOTA_SLOT_PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;

            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`p-3.5 rounded-2xl border-2 transition cursor-pointer relative ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/60 shadow-md ring-2 ring-sky-200'
                    : 'border-slate-200 hover:border-sky-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        isSelected
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      +{pkg.amount}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-slate-900">{pkg.name}</h4>
                        {pkg.badge && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 border border-amber-400">
                            {pkg.badge}
                          </span>
                        )}
                        {pkg.savings && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {pkg.savings}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{pkg.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-black text-sky-950">
                      Rp {pkg.price.toLocaleString('id-ID')}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {pkg.amount > 1
                        ? `Rp ${(pkg.price / pkg.amount).toLocaleString('id-ID')}/slot`
                        : 'Sekali bayar'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Rekening Pembayaran */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 mb-3.5 text-xs text-slate-700">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-sky-600" />
              Transfer Bank Resmi JualRugi:
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
              Verifikasi Cepat
            </span>
          </div>

          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 block">Bank BCA (PT Jual Rugi Digital)</span>
              <span className="font-mono font-bold text-xs text-slate-900 tracking-wider">
                8830-1234-5678
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyBca}
              className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              {copiedRekBca ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
              <span>{copiedRekBca ? 'Tersalin' : 'Salin Rekening'}</span>
            </button>
          </div>
        </div>

        {/* Preview Format Pesan WhatsApp Wajib */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 mb-4 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-extrabold text-[11px] text-emerald-950 flex items-center gap-1.5">
              <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
              Format Pesan Konfirmasi WA:
            </span>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
            >
              {copiedMessage ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-emerald-700" />}
              <span>{copiedMessage ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
          <p className="text-[11px] font-mono text-emerald-900 bg-white/90 p-2 rounded-xl border border-emerald-200/80 leading-relaxed break-words">
            "{rawMessage}"
          </p>
        </div>

        {/* Tombol Aksi Pembayaran Mayar & Konfirmasi WhatsApp */}
        <div className="space-y-2">
          {/* 1. Tombol Bayar Langsung via Mayar */}
          <a
            href={selectedPackage.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 cursor-pointer transition text-center"
            title={`Buka link pembayaran Mayar untuk ${selectedPackage.name}`}
          >
            <ExternalLink className="w-4 h-4 text-white" />
            <span>Bayar {selectedPackage.name} (Rp {selectedPackage.price.toLocaleString('id-ID')}) via Mayar</span>
          </a>

          {/* 2. Tombol Konfirmasi WhatsApp Admin */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] active:scale-98 text-white font-black text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition text-center"
          >
            <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
            <span>Konfirmasi Transfer via WhatsApp Admin</span>
          </a>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer transition text-center"
            >
              Tutup
            </button>

            {onSimulateAdminApproval && (
              <button
                type="button"
                onClick={() => {
                  onSimulateAdminApproval(selectedPackage.amount);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-extrabold text-xs cursor-pointer transition text-center flex items-center justify-center gap-1"
                title="Simulasi aktivasi instan untuk pengujian demo"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Tes Cepat (+{selectedPackage.amount} Kuota)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
