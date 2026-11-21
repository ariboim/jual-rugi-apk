import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Eye,
  Flag,
  CheckCircle2,
  X,
  MessageCircle,
} from 'lucide-react';
import { WhatsAppIcon } from './ListingCard';

export interface WhatsAppSafetyWarningRequest {
  whatsappUrl: string;
  sellerName?: string;
  listingTitle?: string;
  messagePreview?: string;
  onConfirmProceed?: () => void;
  onOpenReport?: () => void;
}

const WA_SAFETY_WARNING_EVENT = 'jualrugi:open-wa-safety-warning';

/**
 * Memicu Kartu Peringatan Keamanan Transaksi sebelum membuka chat WhatsApp seller.
 */
export function openWhatsAppSafetyWarning(request: WhatsAppSafetyWarningRequest) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WhatsAppSafetyWarningRequest>(WA_SAFETY_WARNING_EVENT, {
      detail: request,
    })
  );
}

export const WhatsAppSafetyWarningModal: React.FC = () => {
  const [request, setRequest] = useState<WhatsAppSafetyWarningRequest | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<WhatsAppSafetyWarningRequest>;
      if (customEvent?.detail?.whatsappUrl) {
        setRequest(customEvent.detail);
      }
    };

    window.addEventListener(WA_SAFETY_WARNING_EVENT, handleOpen);
    return () => window.removeEventListener(WA_SAFETY_WARNING_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!request) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRequest(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [request]);

  if (!request) return null;

  const handleConfirmSayaPaham = () => {
    const activeRequest = request;
    setRequest(null);
    if (activeRequest?.onConfirmProceed) {
      try {
        activeRequest.onConfirmProceed();
      } catch (err) {
        console.error('Error running post-warning callback:', err);
      }
    }
  };

  const handleOpenReportClick = () => {
    const reportHandler = request?.onOpenReport;
    setRequest(null);
    if (reportHandler) {
      reportHandler();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-safety-warning-title"
      onClick={() => setRequest(null)}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white border-2 border-red-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Peringatan */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/25 text-amber-200 mb-1">
                Peringatan Keamanan Transaksi
              </span>
              <h3 id="wa-safety-warning-title" className="text-base font-black leading-snug text-white">
                Waspada Penipuan Sebelum Chat Seller!
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRequest(null)}
            aria-label="Tutup peringatan"
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Isi Kartu Peringatan */}
        <div className="p-5 space-y-3.5 overflow-y-auto grow bg-slate-50/60 text-xs leading-relaxed">
          {(request.listingTitle || request.sellerName) && (
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              {request.listingTitle && (
                <p className="font-bold text-slate-900 line-clamp-1">
                  Produk: <span className="text-sky-800">{request.listingTitle}</span>
                </p>
              )}
              {request.sellerName && (
                <p className="text-[11px] text-slate-500">
                  Penjual: <strong className="text-slate-700">{request.sellerName}</strong>
                </p>
              )}
            </div>
          )}

          {/* Callout Larangan DP & Instruksi Laporkan Iklan */}
          <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-950 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-black text-red-800 text-xs sm:text-sm">
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
              <span>DILARANG TRANSFER DP TANPA LIHAT BARANG!</span>
            </div>
            <p className="text-[11px] sm:text-xs text-red-900 leading-relaxed">
              Apapun alasannya (unit banyak peminat, booking dulu, butuh uang cepat, atau titip kurir),{' '}
              <strong>JANGAN PERNAH transfer DP / uang muka sebelum cek barang langsung saat COD!</strong>
            </p>
            <div className="p-2.5 rounded-xl bg-white border border-red-200 flex items-start gap-2 text-red-950">
              <Flag className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                <strong>Instruksi Wajib:</strong> Segera tekan tombol{' '}
                <strong className="text-red-700 underline decoration-red-400">Laporkan Iklan</strong> jika penjual memaksa meminta transfer DP tanpa melihat barang terlebih dahulu, agar Admin langsung memblokir iklan!
              </p>
            </div>
          </div>

          {/* Checklist Aman COD */}
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-white border border-sky-100 flex items-start gap-2.5">
              <Eye className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600">
                <strong className="text-slate-900">1. Cek Fisik & Tes Fungsi:</strong> Pastikan barang asli, normal, dan sesuai foto sebelum bayar.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-sky-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600">
                <strong className="text-slate-900">2. COD di Tempat Ramai:</strong> Ketemuan langsung di lokasi umum (minimarket, mal, atau area publik aman).
              </p>
            </div>
          </div>

          {/* Info Template Chat yang akan dikirim */}
          {request.messagePreview && (
            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Template Chat Otomatis ke Seller:</span>
              </div>
              <p className="text-[10px] text-emerald-900/90 whitespace-pre-line max-h-28 overflow-y-auto font-medium bg-white/80 p-2 rounded-xl border border-emerald-100 leading-relaxed">
                {request.messagePreview}
              </p>
            </div>
          )}
        </div>

        {/* Footer Tombol Close Utama: Saya Paham */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2">
          <a
            href={request.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleConfirmSayaPaham}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all text-center"
          >
            <WhatsAppIcon className="w-5 h-5 fill-white shrink-0" />
            <span>Saya Paham</span>
          </a>

          {request.onOpenReport && (
            <button
              type="button"
              onClick={handleOpenReportClick}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Flag className="w-3.5 h-3.5 text-rose-600" />
              <span>Penjual Meminta DP? Laporkan Iklan Sekarang</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
