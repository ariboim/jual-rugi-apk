import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Flame,
  ArrowUp,
  Receipt,
  Copy,
  Check,
  CreditCard,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Listing, MonetizationPackage } from '../types';
import {
  MAYAR_SUNDUL_URL,
  MAYAR_BU_PRIORITAS_URL,
  WA_ADMIN_PHONE,
  buildWhatsAppConfirmationUrl,
  generateWhatsAppMessage,
} from '../data/mayarConfig';

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
  type: initialType,
  onSuccess,
}) => {
  // Allow switching between Sundul and BU Prioritas inside the modal
  const [selectedPackage, setSelectedPackage] = useState<'sundul' | 'prioritas_bu'>(
    initialType === 'sundul' ? 'sundul' : 'prioritas_bu'
  );
  const [hasClickedPay, setHasClickedPay] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [copiedWA, setCopiedWA] = useState(false);
  const [copiedTxId, setCopiedTxId] = useState(false);
  const [isSimulatingInstantSuccess, setIsSimulatingInstantSuccess] = useState(false);

  // Listing data attributes
  const idIklan = listing?.id || `ad-${Date.now()}`;
  const judulIklan = listing?.title || 'Iklan JualRugi (Upgrade Akun)';
  const namaPengiklan = listing?.seller?.name || 'Pengiklan JualRugi';

  const isSundul = selectedPackage === 'sundul';
  const namaPaket = isSundul ? 'Sundul' : 'Iklan Prioritas';
  const nominal = isSundul ? 25000 : 75000;
  const payUrl = isSundul ? MAYAR_SUNDUL_URL : MAYAR_BU_PRIORITAS_URL;

  // Generate WhatsApp confirmation URL with exact injected parameters
  const waUrl = buildWhatsAppConfirmationUrl({
    id_iklan: idIklan,
    nama_paket: namaPaket,
    nominal: nominal,
    judul_iklan: judulIklan,
    nama_pengiklan: namaPengiklan,
  });

  const rawWaMessage = generateWhatsAppMessage({
    id_iklan: idIklan,
    nama_paket: namaPaket,
    nominal: nominal,
    judul_iklan: judulIklan,
    nama_pengiklan: namaPengiklan,
  });

  // Dummy Transaction ID for Mayar receipt
  const dummyTxId = `MYR-TX-${idIklan.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || '789123'}`;

  const handleOpenPaymentLink = (url: string) => {
    setHasClickedPay(true);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyWAMessage = () => {
    navigator.clipboard?.writeText(rawWaMessage);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  const handleSimulateInstant = () => {
    setIsSimulatingInstantSuccess(true);
    setTimeout(() => {
      onSuccess(listing ? listing.id : 'general-quota', selectedPackage);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden flex flex-col text-slate-800 my-auto animate-scale-up">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white text-sky-700 tracking-wider shadow-xs">
              MAYAR.ID
            </span>
            <div>
              <h3 className="text-sm font-bold leading-tight">Upgrade Promosi Iklan</h3>
              <p className="text-[11px] text-sky-100">Gateway Resmi Mayar & Konfirmasi WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Listing Brief Badge */}
          <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-sky-600 block uppercase tracking-wider">
                Target Iklan (ID: <span className="font-mono text-slate-800">{idIklan}</span>)
              </span>
              <p className="font-bold text-slate-900 truncate mt-0.5">{judulIklan}</p>
              <p className="text-[11px] text-slate-500 truncate">Pengiklan: {namaPengiklan}</p>
            </div>
            {listing?.imageUrl && (
              <img
                src={listing.imageUrl}
                alt={judulIklan}
                className="w-12 h-12 rounded-xl object-cover border border-sky-200 shrink-0"
              />
            )}
          </div>

          {/* 1. Pemilihan Paket (2 Opsi Sesuai Instruksi) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Pilih Paket Upgrade Mayar:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opsi 1: Sundul Iklan */}
              <div
                onClick={() => setSelectedPackage('sundul')}
                className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  selectedPackage === 'sundul'
                    ? 'border-sky-500 bg-sky-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-sky-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-700">
                      <ArrowUp className="w-3.5 h-3.5 text-sky-600 stroke-[2.5]" />
                      Sundul Iklan
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      Top #1 Feed
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900">Rp 25.000</div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Naik langsung ke peringkat #1 teratas beranda seketika & views melesat.
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-emerald-700">
                    +1 Kuota Posting Baru
                  </span>
                  <input
                    type="radio"
                    name="package-select"
                    checked={selectedPackage === 'sundul'}
                    onChange={() => setSelectedPackage('sundul')}
                    className="accent-sky-600 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              {/* Opsi 2: Pasang BU Prioritas */}
              <div
                onClick={() => setSelectedPackage('prioritas_bu')}
                className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  selectedPackage === 'prioritas_bu'
                    ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-400'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                      BU Prioritas
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      24 Jam Eksklusif
                    </span>
                  </div>
                  <div className="text-lg font-black text-amber-900">Rp 75.000</div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Badge kuning emas menyala & prioritas terdepan radar pembeli siap bayar.
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-emerald-700">
                    +1 Kuota Posting Baru
                  </span>
                  <input
                    type="radio"
                    name="package-select"
                    checked={selectedPackage === 'prioritas_bu'}
                    onChange={() => setSelectedPackage('prioritas_bu')}
                    className="accent-amber-600 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Buka Link Mayar Resmi */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => handleOpenPaymentLink(payUrl)}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                isSundul
                  ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/25'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isSundul
                  ? 'Bayar Sundul Iklan - Rp 25.000 via Mayar'
                  : 'Pasang BU Prioritas - Rp 75.000 via Mayar'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-white/80" />
            </button>

            <p className="text-[10.5px] text-center text-slate-500">
              Link resmi: <span className="font-mono text-slate-700 font-semibold">{payUrl}</span>
            </p>
          </div>

          {/* 2. Tombol Konfirmasi Pembayaran (CTA WA Otomatis) */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950">
                  Konfirmasi Pembayaran via WhatsApp Admin
                </h4>
                <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                  Setelah bayar di Mayar, klik tombol di bawah untuk kirim bukti ke WhatsApp Admin ({WA_ADMIN_PHONE}). ID Iklan otomatis tersemat!
                </p>
              </div>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer block text-center"
              title="Kirim pesan konfirmasi pembayaran langsung ke WhatsApp Admin"
            >
              <MessageCircle className="w-4 h-4 fill-white shrink-0" />
              <span>Konfirmasi Pembayaran via WhatsApp Admin</span>
            </a>

            {/* WA Message Preview Accordion */}
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200/80 text-[11px]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-600 text-[10.5px]">Format Pesan Terkirim:</span>
                <button
                  onClick={handleCopyWAMessage}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  {copiedWA ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedWA ? 'Tersalin' : 'Salin Pesan'}</span>
                </button>
              </div>
              <pre className="text-[10px] text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 p-2 rounded-lg border border-slate-100">
                {rawWaMessage}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* DUMMY MAYAR RECEIPT MODAL */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            {/* Struk Header */}
            <div className="p-4 bg-sky-600 text-white text-center relative">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="absolute top-3 right-3 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-sky-700 text-[10px] font-black uppercase mb-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Bukti Pembayaran Mayar.id
              </div>
              <h4 className="text-sm font-black">TRANSAKSI BERHASIL (LUNAS)</h4>
              <p className="text-[10px] text-sky-100 mt-0.5">
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB
              </p>
            </div>

            {/* Receipt Details Body */}
            <div className="p-5 space-y-3.5 text-xs bg-slate-50/60 font-sans">
              <div className="text-center py-2 border-b border-dashed border-slate-300">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Total Pembayaran
                </span>
                <span className="text-2xl font-black text-slate-900">
                  Rp {nominal.toLocaleString('id-ID')}
                </span>
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" /> Status: Lunas / Paid
                </div>
              </div>

              <div className="space-y-2 text-[11px] divide-y divide-slate-200/70">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">ID Transaksi Mayar</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-slate-800">{dummyTxId}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(dummyTxId);
                        setCopiedTxId(true);
                        setTimeout(() => setCopiedTxId(false), 2000);
                      }}
                      className="text-sky-600 hover:text-sky-800 cursor-pointer"
                    >
                      {copiedTxId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Metode Bayar</span>
                  <span className="font-bold text-slate-800">QRIS / Instant Mayar</span>
                </div>

                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Paket</span>
                  <span className="font-bold text-slate-800">{namaPaket}</span>
                </div>

                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">ID Iklan</span>
                  <span className="font-mono font-bold text-sky-700">{idIklan}</span>
                </div>

                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Judul Iklan</span>
                  <span className="font-bold text-slate-800 max-w-[170px] truncate text-right">
                    {judulIklan}
                  </span>
                </div>

                <div className="flex justify-between pt-1.5">
                  <span className="text-slate-500">Pengiklan</span>
                  <span className="font-bold text-slate-800">{namaPengiklan}</span>
                </div>
              </div>

              {/* Receipt Footer CTA */}
              <div className="pt-2 space-y-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition text-center cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>Kirim Struk Ini ke WhatsApp Admin</span>
                </a>

                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    handleSimulateInstant();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>Konfirmasi & Terapkan Status Iklan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
