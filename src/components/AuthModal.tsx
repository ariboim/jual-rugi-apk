import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  Plus,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../types';
import { sendWelcomeEmailAutomation } from '../services/welcomeEmail';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
  onOpenWelcomeEmailSetup?: () => void;
}

/**
 * Google Official G Logo SVG
 */
const GoogleLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'register',
  onOpenWelcomeEmailSetup,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State Dialog Pemilih Akun Google (Google Account Chooser)
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);
  const [customGmail, setCustomGmail] = useState('');

  if (!isOpen) return null;

  const handleSwitchMode = (targetMode: 'login' | 'register') => {
    setMode(targetMode);
    setErrorMessage(null);
  };

  // Buka Dialog Pemilih Akun Google
  const handleOpenGooglePicker = () => {
    setErrorMessage(null);
    setIsGooglePickerOpen(true);
  };

  // Pengguna memilih akun Google tertentu
  const handleSelectGoogleAccount = async (selectedName: string, selectedEmail: string, avatarUrl: string) => {
    setIsLoading(true);
    setAgreedToDisclaimer(true); // Memilih akun Google secara otomatis menyetujui disclaimer

    // ⚡ Trigger otomatisasi welcome email seketika berdasarkan alamat Gmail user via Brevo
    try {
      await sendWelcomeEmailAutomation({
        name: selectedName,
        email: selectedEmail,
        phone: '0812-8888-9999',
      });
    } catch (emailErr) {
      console.warn('Welcome email trigger error:', emailErr);
    }

    setIsLoading(false);
    setIsGooglePickerOpen(false);

    const googleUser: UserProfile = {
      id: `google-${Date.now()}`,
      name: selectedName,
      role: 'buyer',
      avatar: avatarUrl,
      email: selectedEmail,
      phone: '0812-8888-9999',
      city: 'Jakarta Selatan',
      freeListingUsed: false,
      listingQuota: 1, // 1 free listing for new signup
      activeListingCount: 0,
      permissions: {
        locationGranted: false,
        cameraGalleryGranted: false,
      },
    };

    onLoginSuccess(googleUser);
    onClose();
  };

  // Submit form pendaftaran manual (Email/WhatsApp)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailOrPhone.trim()) {
      setErrorMessage('Mohon masukkan Email atau Nomor WhatsApp Anda.');
      return;
    }

    if (mode === 'register' && !agreedToDisclaimer) {
      setErrorMessage('Anda wajib mencentang persetujuan Syarat & Ketentuan serta Disclaimer Transaksi sebelum mendaftar.');
      return;
    }

    const regName = name.trim() || 'Member JualRugi';
    const regEmail = emailOrPhone.includes('@')
      ? emailOrPhone.trim()
      : `${regName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
    const regPhone = !emailOrPhone.includes('@') ? emailOrPhone.trim() : '0812-3344-5566';

    setIsLoading(true);

    // ⚡ Trigger otomatisasi welcome email seketika berdasarkan email pendaftar via Brevo
    try {
      console.log('⚡ Triggering welcome email for:', regEmail);
      await sendWelcomeEmailAutomation({
        name: regName,
        email: regEmail,
        phone: regPhone,
      });
    } catch (emailErr) {
      console.warn('Welcome email trigger error:', emailErr);
    }

    setIsLoading(false);
    const authenticatedUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: regName,
      role: 'buyer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      email: regEmail,
      phone: regPhone,
        city: 'Jakarta Selatan',
        freeListingUsed: false,
        listingQuota: 1, // 1 free listing for new signup
        activeListingCount: 0,
        permissions: {
          locationGranted: false,
          cameraGalleryGranted: false,
        },
    };
    onLoginSuccess(authenticatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden my-auto p-5 sm:p-6 text-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-sky-50 mb-2 border border-sky-100">
            <img
              src="/assets/aistudio/logo_transparent.png"
              alt="JualRugi.id"
              className="h-8 w-auto object-contain"
            />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-sky-950">
            {mode === 'register' ? 'Daftar Akun JualRugi.id' : 'Masuk ke Akun Anda'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'register'
              ? 'Dapatkan akses promo harga gila & distress sale harian!'
              : 'Pantau barang impian dan ajukan penawaran COD langsung ke penjual.'}
          </p>
        </div>

        {/* Tabs: Daftar vs Masuk */}
        <div className="grid grid-cols-2 p-1 bg-sky-50/80 rounded-2xl mb-4 border border-sky-100">
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            className={`py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
              mode === 'register'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-sky-950'
            }`}
          >
            Daftar Akun Baru
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            className={`py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
              mode === 'login'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-sky-950'
            }`}
          >
            Masuk / Login
          </button>
        </div>

        {/* Banner Otomatisasi Welcome Email Langsung */}
        {mode === 'register' && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200/80 text-emerald-950 mb-3 shadow-2xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs">
                ✉️
              </span>
              <div className="truncate">
                <p className="text-[11px] font-black leading-tight truncate">
                  Welcome Email Otomatis Aktif
                </p>
                <p className="text-[9.5px] text-emerald-700 font-medium truncate">
                  Email panduan transaksi aman langsung dikirim ke inbox pendaftar
                </p>
              </div>
            </div>
            {onOpenWelcomeEmailSetup && (
              <button
                type="button"
                onClick={onOpenWelcomeEmailSetup}
                className="shrink-0 text-[10px] font-black text-sky-700 hover:text-sky-900 bg-white px-2 py-1 rounded-lg border border-sky-200 transition cursor-pointer ml-1"
              >
                Setup Zapier
              </button>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* Tombol Utama: Google Sign-In (Membuka Pilihan Akun Google) */}
        {/* ========================================================= */}
        <button
          type="button"
          onClick={handleOpenGooglePicker}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-sky-400 bg-white hover:bg-sky-50/50 font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-center gap-3 shadow-xs cursor-pointer active:scale-98 transition mb-3 group"
        >
          <GoogleLogo />
          <span className="group-hover:text-sky-950">
            {mode === 'register' ? 'Daftar dengan Akun Google' : 'Lanjutkan dengan Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-3">
          <div className="grow border-t border-slate-200" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            atau dengan form manual
          </span>
          <div className="grow border-t border-slate-200" />
        </div>

        {/* Standard Manual Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Pratama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-slate-900 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email atau Nomor WhatsApp
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="nama@email.com atau 0812xxxxxxxx"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-slate-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* SYARAT & KETENTUAN / DISCLAIMER TRANSAKSI (WAJIB DAFTAR) */}
          {/* ======================================================== */}
          {mode === 'register' && (
            <div className="space-y-2 pt-1">
              <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-3.5 text-slate-800 text-xs shadow-2xs">
                {/* Header Disclaimer */}
                <div className="flex items-center gap-1.5 pb-2 border-b border-amber-200/80 text-amber-950 font-extrabold">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] sm:text-xs uppercase tracking-wide">
                    Syarat & Ketentuan / Disclaimer Transaksi
                  </span>
                </div>

                {/* 4 Poin Inti Disclaimer */}
                <div className="mt-2.5 space-y-2 text-[11px] leading-relaxed text-slate-700">
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-950 shrink-0">•</span>
                    <p>
                      <strong className="text-amber-950">Transaksi Langsung:</strong> Seluruh transaksi jual-beli dilakukan secara mandiri dan langsung antara pihak penjual dan pembeli (COD tatap muka / transfer langsung).
                    </p>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-950 shrink-0">•</span>
                    <p>
                      <strong className="text-amber-950">Posisi Platform:</strong> <span className="font-semibold text-slate-900">jualrugi.id</span> bertindak semata-mata sebagai platform/aplikasi pihak ketiga penyedia ruang listing, bukan pihak penengah transaksi.
                    </p>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-950 shrink-0">•</span>
                    <p>
                      <strong className="text-amber-950">Batasan Tanggung Jawab:</strong> <span className="font-semibold text-slate-900">jualrugi.id</span> tidak bertanggung jawab dalam bentuk apa pun atas segala tindak penipuan, kerugian finansial, sengketa, atau cacat barang.
                    </p>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-950 shrink-0">•</span>
                    <p>
                      <strong className="text-amber-950">Kehati-hatian Pembeli:</strong> Keamanan transaksi, verifikasi identitas penjual, dan pengecekan keaslian/kondisi barang merupakan tanggung jawab penuh masing-masing pembeli.
                    </p>
                  </div>
                </div>

                {/* Kotak Checkbox Persetujuan Wajib */}
                <label className="flex items-start gap-2.5 mt-3 pt-2.5 border-t border-amber-200 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    required
                    checked={agreedToDisclaimer}
                    onChange={(e) => {
                      setAgreedToDisclaimer(e.target.checked);
                      if (e.target.checked) setErrorMessage(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-amber-400 text-sky-600 focus:ring-sky-500 shrink-0 cursor-pointer accent-sky-600"
                  />
                  <span className="text-[11px] font-bold text-slate-900 leading-snug group-hover:text-amber-950">
                    Saya telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan serta Disclaimer Transaksi di atas. <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>

              {/* Alert Error / Peringatan Ramah jika dicoba submit tanpa centang */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Tombol Submit Manual */}
          <button
            type="submit"
            disabled={isLoading || (mode === 'register' && !agreedToDisclaimer)}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition mt-4 ${
              mode === 'register' && !agreedToDisclaimer
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                : 'bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/25 cursor-pointer active:scale-98'
            }`}
            title={
              mode === 'register' && !agreedToDisclaimer
                ? 'Centang kotak persetujuan disclaimer untuk mengaktifkan tombol'
                : undefined
            }
          >
            <span>{mode === 'register' ? 'Daftar Sekarang' : 'Masuk ke Akun'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-[10px] text-slate-400 text-center mt-4">
          Dengan melanjutkan, Anda menyetujui Ketentuan Layanan & Protokol Transaksi COD Aman JualRugi.id.
        </p>
      </div>

      {/* ======================================================== */}
      {/* POPUP GOOGLE IDENTITY: PILIHAN AKUN GMAIL USER RESMI      */}
      {/* ======================================================== */}
      {isGooglePickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-800 p-6 animate-in zoom-in-95 duration-200">
            {/* Header Google Identity */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <GoogleLogo />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Login dengan Google
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pilih akun Gmail Anda untuk melanjutkan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGooglePickerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List Pilihan Akun Google Aktif */}
            <div className="mt-4 space-y-2">
              {/* Akun Gmail Pengguna Utama (bca.ccpl@gmail.com) */}
              <button
                type="button"
                onClick={() =>
                  handleSelectGoogleAccount(
                    'Pengguna Google (BCA)',
                    'bca.ccpl@gmail.com',
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                  )
                }
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    B
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-sky-950">
                      Pengguna Google
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      bca.ccpl@gmail.com
                    </p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
              </button>

              {/* Akun Gmail Alternatif (indodigital1978@gmail.com) */}
              <button
                type="button"
                onClick={() =>
                  handleSelectGoogleAccount(
                    'Indo Digital',
                    'indodigital1978@gmail.com',
                    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80'
                  )
                }
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    I
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-sky-950">
                      Indo Digital
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      indodigital1978@gmail.com
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
              </button>

              {/* Pilihan: Masukkan Akun Google Lain */}
              {!showCustomEmailInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomEmailInput(true)}
                  className="w-full p-3 rounded-2xl border border-dashed border-slate-300 hover:border-sky-400 hover:bg-slate-50 flex items-center gap-3 text-left transition cursor-pointer text-slate-600 hover:text-sky-950"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Gunakan akun Google lain
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Masukkan alamat @gmail.com pribadi Anda
                    </p>
                  </div>
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-sky-200 space-y-2 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Ketik Alamat Gmail Anda:
                  </label>
                  <input
                    type="email"
                    autoFocus
                    placeholder="namaanda@gmail.com"
                    value={customGmail}
                    onChange={(e) => setCustomGmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-sky-300 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!customGmail.includes('@')}
                      onClick={() => {
                        const emailName = customGmail.split('@')[0];
                        const formattedName =
                          emailName.charAt(0).toUpperCase() + emailName.slice(1);
                        handleSelectGoogleAccount(
                          formattedName,
                          customGmail,
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                        );
                      }}
                      className="grow py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Masuk dengan Akun Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomEmailInput(false)}
                      className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Disclaimer & Keamanan Google */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed space-y-1">
              <p>
                Dengan memilih akun, Anda menyetujui bahwa Google akan membagikan nama, email, dan foto profil Anda ke <strong>JualRugi.id</strong> serta menyetujui seluruh <strong>Syarat, Ketentuan & Disclaimer Transaksi</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
