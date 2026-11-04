import React from 'react';
import { X, ShieldCheck, AlertOctagon, MapPin, Eye, CheckCircle2 } from 'lucide-react';

interface CODSafetyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CODSafetyGuideModal: React.FC<CODSafetyGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/35 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-sky-950">Panduan Aman Transaksi COD</h3>
              <p className="text-[11px] text-slate-500">Protokol Keamanan JualRugi.my.id</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-sky-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto grow text-xs leading-relaxed text-slate-700 bg-sky-50/40">
          {/* Warning Callout */}
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              <span>ATURAN EMAS: JANGAN PERNAH TRANSFER DP!</span>
            </div>
            <p className="text-xs text-red-900">
              Modus penipuan paling umum adalah meminta DP uang muka, ongkir kurir, atau uang booking. <strong>Semua transaksi di JualRugi.my.id 100% wajib COD tunai/QRIS di tempat.</strong> Jika ada penjual memaksa transfer dulu, langsung tolak!
            </p>
          </div>

          {/* 3 Pillars of Safe COD */}
          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-white border border-sky-100 flex items-start gap-3 shadow-xs">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sky-950 text-xs">1. Pilih Lokasi Ramai & Terang</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Gunakan tombol <em>"Ajukan Titik COD"</em> di chat. Rekomendasi: Indomaret Point, lobi Mall, kafe ramai, atau pos keamanan/kantor Polsek terdekat. Hindari tempat sepi atau janji larut malam.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-sky-100 flex items-start gap-3 shadow-xs">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700 shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sky-950 text-xs">2. Cek Kondisi & Tes Fungsi Menyeluruh</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  - <strong>Smartphone/Laptop:</strong> Cek layar, kamera, suara, baterai, port charger, akun, dan IMEI.<br />
                  - <strong>Sepeda Motor:</strong> Cek kecocokan nomor rangka/mesin dengan STNK & BPKB asli.<br />
                  - <strong>Elektronik:</strong> Coba colok ke stopkontak untuk membuktikan fungsi normal.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-sky-100 flex items-start gap-3 shadow-xs">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sky-950 text-xs">3. Ajak Teman Saat Bertemu</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Terutama untuk transaksi barang bernilai jutaan rupiah (motor atau gadget flagship), selalu ajak rekan saat menemui penjual atau pembeli.
                </p>
              </div>
            </div>
          </div>

          {/* Sky Blue Confirmation Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs cursor-pointer shadow-sm shadow-sky-500/25 transition"
          >
            Saya Mengerti & Patuhi Aturan
          </button>
        </div>
      </div>
    </div>
  );
};
