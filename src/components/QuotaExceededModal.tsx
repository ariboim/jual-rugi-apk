import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ArrowUp,
  Flame,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, MonetizationPackage } from '../types';
import { MAYAR_PRODUCTS, buildMayarCheckoutUrl } from '../data/mayarConfig';

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectPromotion: (packageType: MonetizationPackage) => void;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectPromotion,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<MonetizationPackage>('sundul');
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

  const handleCheckoutMayar = (plan: MonetizationPackage) => {
    setIsRedirecting(true);
    // Open Mayar payment flow
    setTimeout(() => {
      setIsRedirecting(false);
      onSelectPromotion(plan);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto p-5 sm:p-6 text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon & Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 border-2 border-amber-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            Kuota Iklan Habis
          </span>

          <h3 className="text-lg sm:text-xl font-black text-sky-950 mt-2">
            Batas Iklan Gratis Sudah Terpakai
          </h3>

          {/* Exact required copy from prompt */}
          <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-slate-800 text-xs sm:text-sm font-semibold leading-relaxed">
            "Batas iklan gratis Anda sudah terpakai. Untuk membuka slot 1 iklan baru, silakan beli salah satu fitur promosi: <strong>Sundul Iklan</strong> atau <strong>Prioritas BU Banget</strong>."
          </div>
        </div>

        {/* Status Tracker */}
        <div className="bg-sky-50/70 p-3.5 rounded-2xl border border-sky-100 mb-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Status Akun:</span>
            <span className="font-bold text-sky-950">{currentUser.name}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[11px]">Sisa Kuota Posting:</span>
            <span className="font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-[11px]">
              0 Slot Tersedia
            </span>
          </div>
        </div>

        {/* Promotional Packages Selection with Mayar Pricing */}
        <div className="space-y-3 mb-5">
          {/* Option 1: Sundul Iklan - Rp 25.000 */}
          <div
            onClick={() => setSelectedPlan('sundul')}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
              selectedPlan === 'sundul'
                ? 'border-sky-500 bg-sky-50/50 shadow-md ring-2 ring-sky-200'
                : 'border-slate-200 hover:border-sky-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-sky-950">Sundul Iklan</h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      +1 Slot Iklan Baru
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Naikkan iklan ke posisi #1 feed teratas + buka 1 slot posting baru.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-black text-sky-950">Rp 25.000</div>
                <span className="text-[10px] font-bold text-sky-600">Mayar Checkout</span>
              </div>
            </div>
          </div>

          {/* Option 2: Prioritas BU Banget - Rp 75.000 */}
          <div
            onClick={() => setSelectedPlan('prioritas_bu')}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
              selectedPlan === 'prioritas_bu'
                ? 'border-amber-400 bg-amber-50/50 shadow-md ring-2 ring-amber-200'
                : 'border-slate-200 hover:border-amber-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-xs">
                  <Flame className="w-5 h-5 fill-amber-950 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-slate-900">Prioritas BU Banget</h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300">
                      +1 Slot Iklan Baru
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Highlight kuning emas & lencana eksklusif 24 jam + buka 1 slot posting baru.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-black text-amber-900">Rp 75.000</div>
                <span className="text-[10px] font-bold text-amber-700">Mayar Checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Mayar Payment Gateway badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Pembayaran instan diproses aman oleh <strong>Mayar.id</strong> (QRIS, VA, E-Wallet)</span>
        </div>

        {/* Action Button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isRedirecting}
            onClick={() => handleCheckoutMayar(selectedPlan)}
            className="w-2/3 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {isRedirecting
                ? 'Menghubungkan ke Mayar...'
                : `Beli ${MAYAR_PRODUCTS[selectedPlan].name} (Rp ${MAYAR_PRODUCTS[selectedPlan].price.toLocaleString('id-ID')})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
