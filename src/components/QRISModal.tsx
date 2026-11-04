import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  Flame,
  ArrowUp,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';
import { Listing, MonetizationPackage } from '../types';
import { MAYAR_PRODUCTS, buildMayarCheckoutUrl } from '../data/mayarConfig';

export type MonetizationType = 'sundul' | 'superbu' | 'prioritas_bu';

interface QRISModalProps {
  onClose: () => void;
  listing: Listing | null;
  type: MonetizationType;
  onSuccess: (listingId: string, type: MonetizationType) => void;
  userId?: string;
  userEmail?: string;
}

export const QRISModal: React.FC<QRISModalProps> = ({
  onClose,
  listing,
  type,
  onSuccess,
  userId = 'user-current',
  userEmail = 'member@jualrugi.my.id',
}) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const normalizedType: MonetizationPackage = type === 'sundul' ? 'sundul' : 'prioritas_bu';
  const productConfig = MAYAR_PRODUCTS[normalizedType];
  const price = productConfig.price; // 25000 or 75000
  const title = productConfig.name;

  const mayarUrl = buildMayarCheckoutUrl(
    normalizedType,
    userId,
    listing?.id,
    userEmail
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      setTimeout(() => {
        onSuccess(listing ? listing.id : 'general-quota', type);
        onClose();
      }, 1500);
    }, 900);
  };

  const handleCopyPaymentLink = () => {
    navigator.clipboard?.writeText(mayarUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden flex flex-col text-slate-800 my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2 py-0.5 rounded-sm bg-sky-500 text-white">
              MAYAR
            </span>
            <span className="text-xs font-bold text-sky-950">Payment Gateway</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-sky-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-center space-y-4 bg-sky-50/50">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-sky-900 mb-1">
              {normalizedType === 'sundul' ? (
                <ArrowUp className="w-4 h-4 text-sky-600 stroke-[2.5]" />
              ) : (
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              )}
              <span>{title}</span>
            </div>

            {listing ? (
              <p className="text-[11px] text-slate-500 truncate max-w-[280px] mx-auto font-medium">
                Iklan: {listing.title}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 font-medium">
                Membuka kuota posting +1 slot iklan baru
              </p>
            )}

            <div className="mt-2 text-2xl font-black text-sky-950">
              Rp {price.toLocaleString('id-ID')}
            </div>

            {/* Quota bonus pill */}
            <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Otomatis Tambah Kuota Posting +1 Slot</span>
            </div>

            <div className="text-[10px] text-slate-400 mt-1">
              Gateway: Mayar.id • QRIS / VA BCA / Mandiri / GoPay / OVO
            </div>
          </div>

          {/* QR Code Container with Sky Blue Pattern */}
          <div className="p-4 bg-white rounded-2xl mx-auto w-56 aspect-square flex flex-col items-center justify-center shadow-sm relative border-2 border-sky-200">
            {isPaid ? (
              <div className="text-center text-slate-900 animate-scale-up">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                <h4 className="font-black text-sm mt-2 text-emerald-800">
                  Pembayaran Terverifikasi!
                </h4>
                <p className="text-[11px] font-bold text-slate-700 mt-1">
                  🎉 Kuota +1 slot berhasil ditambahkan ke akun Anda!
                </p>
                {normalizedType === 'sundul' ? (
                  <p className="text-[10px] text-sky-700 font-semibold mt-0.5">
                    🚀 Iklan disundul langsung ke urutan #1 teratas feed!
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                    🔥 Highlight emas & lencana PALING BU aktif 24 jam!
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="w-full h-full flex flex-col items-center justify-between p-1">
                  <div className="w-full flex items-center justify-between px-1">
                    <span className="text-[9px] font-black tracking-widest text-sky-800">
                      QRIS MAYAR
                    </span>
                    <span className="text-[8px] font-bold text-sky-600">GPN</span>
                  </div>

                  {/* Sky Blue QR Matrix */}
                  <svg
                    viewBox="0 0 100 100"
                    className="w-38 h-38"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="5" y="5" width="28" height="28" rx="4" fill="#0284c7" />
                    <rect x="9" y="9" width="20" height="20" rx="2" fill="#ffffff" />
                    <rect x="13" y="13" width="12" height="12" rx="2" fill="#0284c7" />

                    <rect x="67" y="5" width="28" height="28" rx="4" fill="#0284c7" />
                    <rect x="71" y="9" width="20" height="20" rx="2" fill="#ffffff" />
                    <rect x="75" y="13" width="12" height="12" rx="2" fill="#0284c7" />

                    <rect x="5" y="67" width="28" height="28" rx="4" fill="#0284c7" />
                    <rect x="9" y="71" width="20" height="20" rx="2" fill="#ffffff" />
                    <rect x="13" y="75" width="12" height="12" rx="2" fill="#0284c7" />

                    <rect x="38" y="8" width="6" height="6" fill="#0284c7" />
                    <rect x="48" y="14" width="6" height="6" fill="#0284c7" />
                    <rect x="38" y="24" width="6" height="6" fill="#0284c7" />
                    <rect x="56" y="24" width="6" height="6" fill="#0284c7" />
                    <rect x="8" y="38" width="6" height="6" fill="#0284c7" />
                    <rect x="18" y="48" width="6" height="6" fill="#0284c7" />
                    <rect x="28" y="38" width="6" height="6" fill="#0284c7" />
                    <rect x="38" y="38" width="6" height="6" fill="#0284c7" />
                    <rect x="48" y="44" width="6" height="6" fill="#0284c7" />
                    <rect x="58" y="38" width="6" height="6" fill="#0284c7" />
                    <rect x="68" y="44" width="6" height="6" fill="#0284c7" />
                    <rect x="78" y="38" width="6" height="6" fill="#0284c7" />
                    <rect x="88" y="44" width="6" height="6" fill="#0284c7" />
                    <rect x="44" y="58" width="6" height="6" fill="#0284c7" />
                    <rect x="54" y="68" width="6" height="6" fill="#0284c7" />
                    <rect x="64" y="58" width="6" height="6" fill="#0284c7" />
                    <rect x="74" y="68" width="6" height="6" fill="#0284c7" />
                    <rect x="84" y="58" width="6" height="6" fill="#0284c7" />
                    <rect x="38" y="78" width="6" height="6" fill="#0284c7" />
                    <rect x="48" y="84" width="6" height="6" fill="#0284c7" />
                    <rect x="60" y="78" width="6" height="6" fill="#0284c7" />
                    <rect x="78" y="84" width="6" height="6" fill="#0284c7" />

                    <circle cx="50" cy="50" r="10" fill="#ffffff" />
                    <image
                      href="/assets/aistudio/logo_icon_transparent.png"
                      x="42"
                      y="42"
                      width="16"
                      height="16"
                    />
                  </svg>

                  <div className="text-[8px] text-slate-500 font-mono">
                    Scan via BCA, Mandiri, GoPay, OVO, Dana
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Countdown & Instructions */}
          {!isPaid && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Selesaikan dalam: </span>
              <strong className="text-sky-700 font-mono">{formatTimer(timeLeft)}</strong>
            </div>
          )}

          {/* Mayar Link Button & Instant Verification Simulator */}
          {!isPaid && (
            <div className="space-y-2">
              <button
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/25 cursor-pointer active:scale-98 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>
                  {isProcessing
                    ? 'Memverifikasi Webhook Mayar...'
                    : `Simulasi Bayar Rp ${price.toLocaleString('id-ID')} via Mayar`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyPaymentLink}
                className="w-full py-2 rounded-xl border border-sky-200 hover:bg-white text-sky-900 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Pembayaran Mayar Disalin!' : 'Salin Tautan Mayar Payment Link'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
