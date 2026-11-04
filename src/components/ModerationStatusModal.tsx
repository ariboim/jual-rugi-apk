import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  BellRing,
  ShieldAlert,
  Sparkles,
  X,
  Volume2,
} from 'lucide-react';
import { requestBrowserNotificationPermission } from '../services/notificationService';

interface ModerationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingTitle?: string;
  category?: string;
  autoCloseSeconds?: number; // Default 5 detik sesuai requirement
  onNotificationPermissionRequested?: () => void;
}

export const ModerationStatusModal: React.FC<ModerationStatusModalProps> = ({
  isOpen,
  onClose,
  listingTitle = 'Produk Anda',
  category = 'Umum',
  autoCloseSeconds = 5,
  onNotificationPermissionRequested,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(autoCloseSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    } else {
      setNotificationStatus('unsupported');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(autoCloseSeconds);
      setIsPaused(false);
      return;
    }

    setSecondsLeft(autoCloseSeconds);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (isPaused) return prev;
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, autoCloseSeconds, onClose]);

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotificationStatus(perm as any);
    if (onNotificationPermissionRequested) {
      onNotificationPermissionRequested();
    }
  };

  if (!isOpen) return null;

  const progressPercentage = ((autoCloseSeconds - secondsLeft) / autoCloseSeconds) * 100;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-sky-950/45 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 px-5 pt-5 pb-4 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-xs">
              <Clock className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 inline-block shadow-2xs">
                Antrean Moderasi Sistem
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Iklan Sedang Dimoderasi
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs bg-slate-50/50">
          {/* Main Primary Message Box (Exact User Requirement) */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2 shadow-xs">
            <div className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-amber-950 leading-snug">
                  "Iklan Anda sedang dimoderasi. Mohon menunggu kurang lebih 5 menit."
                </p>
                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  Iklan <strong className="text-slate-900 font-bold">"{listingTitle}"</strong> ({category}) telah diterima dan sedang diaudit oleh sistem untuk menjamin otentisitas foto & diskon minimal 15%.
                </p>
              </div>
            </div>
          </div>

          {/* Web Push Notification Status & Simulation Note */}
          <div className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
                <BellRing className="w-4 h-4 text-sky-600" />
                <span>Simulasi Push Notifikasi (2-3 Menit)</span>
              </div>
              {notificationStatus === 'granted' ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Aktif
                </span>
              ) : notificationStatus === 'denied' ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">
                  Diblokir
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold underline cursor-pointer"
                >
                  Izinkan Notifikasi
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Setelah jeda 2-3 menit, sistem akan otomatis mengirimkan push notifikasi ke HP/Layar Anda bertuliskan:
              <br />
              <span className="inline-block mt-1 font-semibold text-sky-950 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200">
                🎉 "Iklan Berhasil Tayang! - Selamat, iklan Anda telah selesai dimoderasi..."
              </span>
            </p>
          </div>

          {/* Tips COD Aman singkat */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Semua transaksi di JualRugi.my.id wajib COD tatap muka tanpa uang muka.</span>
          </div>

          {/* Auto-Close Visual Indicator (Option B: Minimal Jeda 5 Detik) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
              <span>{isPaused ? '⏸️ Timer dijeda (kursor di atas modal)' : 'Menutup otomatis dalam:'}</span>
              <span className="font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                {secondsLeft} Detik
              </span>
            </div>
            {/* Smooth Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${100 - progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-400 hidden xs:block">
            Klik tombol untuk menutup langsung
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full xs:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md shadow-sky-600/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ml-auto"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Saya Mengerti ({secondsLeft}s)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
