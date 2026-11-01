import React from 'react';
import { Camera, Image as ImageIcon, ShieldCheck, X, AlertCircle, RefreshCw } from 'lucide-react';

interface CameraGalleryPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantPermission: () => void;
  permissionDenied?: boolean;
}

export const CameraGalleryPermissionModal: React.FC<CameraGalleryPermissionModalProps> = ({
  isOpen,
  onClose,
  onGrantPermission,
  permissionDenied = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto p-5 sm:p-6 text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Camera & Gallery Icons */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 border border-sky-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Camera className="w-8 h-8 stroke-[2.2]" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
            Izin Perangkat
          </span>

          <h3 className="text-lg font-black text-sky-950 mt-2">
            Akses Galeri & Kamera
          </h3>

          {/* Exact required copy from prompt */}
          <div className="mt-3 p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs sm:text-sm font-semibold leading-relaxed">
            "Izinkan akses galeri & kamera untuk mengambil foto produk yang akan Anda jual di jualrugi.id."
          </div>
        </div>

        {/* If denied state */}
        {permissionDenied ? (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-950 text-xs space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Izin Kamera/Galeri Dinonaktifkan di Browser</strong>
                <p className="text-[11px] text-red-800 mt-1">
                  Untuk mengaktifkannya kembali, klik ikon gembok / izin situs di bilah alamat browser Anda, lalu izinkan akses Kamera dan Penyimpanan/Berkas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Memilih foto bukti fisik langsung dari galeri ponsel Anda.</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Mengambil foto kondisi minus dan detail sudut produk secara riil.</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer transition"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            onClick={() => {
              onGrantPermission();
              onClose();
            }}
            className="w-2/3 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition"
          >
            {permissionDenied ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Coba Lagi Izinkan</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Izinkan Akses Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
