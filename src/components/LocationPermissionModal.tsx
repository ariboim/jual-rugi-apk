import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Compass,
} from 'lucide-react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationGranted: (city: string, coords?: { lat: number; lng: number }) => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onLocationGranted,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState('');

  if (!isOpen) return null;

  const handleRequestGPS = () => {
    setIsRequesting(true);
    setErrorMessage(null);

    if (!('geolocation' in navigator)) {
      setIsRequesting(false);
      setErrorMessage('Browser Anda tidak mendukung Geolocation API. Silakan pilih kota manual.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsRequesting(false);
        const { latitude, longitude } = position.coords;
        // In Indonesia demo, default to closest region or detected city
        const detectedCity = 'Jakarta Selatan';
        onLocationGranted(detectedCity, { lat: latitude, lng: longitude });
        onClose();
      },
      (error) => {
        setIsRequesting(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage(
            'Izin lokasi GPS ditolak oleh browser. Anda dapat memilih kota COD secara manual di bawah ini.'
          );
        } else {
          setErrorMessage('Gagal mendeteksi lokasi GPS. Silakan tentukan kota COD Anda.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleManualSelect = (city: string) => {
    setSelectedCity(city);
    onLocationGranted(city);
    onClose();
  };

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

        {/* Visual Icon */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 border border-sky-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Compass className="w-8 h-8 animate-spin-slow stroke-[2.2]" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
            Onboarding Lokasi
          </span>

          <h3 className="text-lg font-black text-sky-950 mt-2">
            Aktifkan Izin Lokasi GPS
          </h3>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Aktifkan GPS untuk menghitung <strong>radius listing BU terdekat</strong> dan memastikan negosiasi titik temu COD aman di sekitar area tempat tinggal Anda.
          </p>
        </div>

        {/* Error notification if denied */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* GPS Permission Action Button */}
        <button
          type="button"
          disabled={isRequesting}
          onClick={handleRequestGPS}
          className="w-full py-3.5 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition mb-3"
        >
          <Navigation className="w-4 h-4" />
          <span>{isRequesting ? 'Mendeteksi Lokasi GPS...' : 'Aktifkan GPS Otomatis'}</span>
        </button>

        {/* Fallback Option: Pilih Kota Manual */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-500 mb-2">
            Atau pilih kota domisili COD secara manual:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Jakarta Selatan',
              'Jakarta Barat',
              'Bekasi',
              'Tangerang',
              'Depok',
              'Bandung',
              'Surabaya',
              'Semarang',
            ].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleManualSelect(city)}
                className="p-2 text-left rounded-xl border border-sky-100 hover:border-sky-300 hover:bg-sky-50/60 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">{city}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Privasi terjaga: koordinat GPS hanya digunakan untuk kalkulasi jarak radius.</span>
        </div>
      </div>
    </div>
  );
};
