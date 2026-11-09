import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { sendWelcomeEmailAutomation, sendRegistrationToMakeWebhook } from '../services/welcomeEmail';
import { registerUserInSupabase, fetchUserByEmailFromSupabase } from '../services/supabase';
import { BrandLogo } from './BrandLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
  onOpenWelcomeEmailSetup?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'register',
  onOpenWelcomeEmailSetup,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form Fields - Registrasi
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);

  // Form Fields - Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Validation & UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSwitchMode = (targetMode: 'login' | 'register') => {
    setMode(targetMode);
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
  };

  /**
   * Filter WhatsApp hanya menerima digit angka
   */
  const handleWhatsAppInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnly = e.target.value.replace(/\D/g, '');
    setWhatsapp(numericOnly);
    if (errors.whatsapp) {
      setErrors((prev) => ({ ...prev, whatsapp: '' }));
    }
  };

  /**
   * Validasi Front-End untuk Form Registrasi
   */
  const validateRegistration = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Validasi Nama Lengkap
    if (!name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi.';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Nama lengkap minimal 3 karakter.';
    }

    // 2. Validasi Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Alamat email wajib diisi.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Format email tidak valid (contoh: user@gmail.com).';
    }

    // 3. Validasi Kata Sandi
    if (!password) {
      newErrors.password = 'Kata sandi wajib diisi.';
    } else if (password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter.';
    }

    // 4. Validasi Nomor WhatsApp
    if (!whatsapp.trim()) {
      newErrors.whatsapp = 'Nomor WhatsApp wajib diisi.';
    } else if (!/^(08|628)[0-9]{8,12}$/.test(whatsapp.trim())) {
      newErrors.whatsapp = 'Format salah. Gunakan awalan 08 atau 628 (total 10-14 angka).';
    }

    // 5. Validasi Persetujuan Disclaimer
    if (!agreedToDisclaimer) {
      newErrors.disclaimer = 'Anda wajib menyetujui Syarat & Ketentuan serta Disclaimer Transaksi.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validasi Front-End untuk Form Login
   */
  const validateLogin = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!loginIdentifier.trim()) {
      newErrors.loginIdentifier = 'Email atau Nomor WhatsApp wajib diisi.';
    }

    if (!loginPassword) {
      newErrors.loginPassword = 'Kata sandi wajib diisi.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submit Handler (Registrasi / Login)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (mode === 'register') {
      const isValid = validateRegistration();
      if (!isValid) return;

      setIsLoading(true);

      const regName = name.trim();
      const regEmail = email.trim().toLowerCase();
      const regPhone = whatsapp.trim();
      const regPassword = password;
      const newUserId = `user-${Date.now()}`;

      // 1. Simpan Data Pendaftaran ke Database Supabase (Tabel 'users')
      try {
        console.log('[Auth] Menyimpan user ke Supabase database (Tabel users)...');
        registerUserInSupabase({
          id: newUserId,
          name: regName,
          email: regEmail,
          password: regPassword,
          whatsapp: regPhone,
        }).catch((sbErr) => {
          console.warn('[Auth] Catatan Supabase DB:', sbErr);
        });
      } catch (sbEx) {
        console.warn('[Auth] Supabase exception:', sbEx);
      }

      // 2. Kirim Data Registrasi ke Webhook Make.com (format JSON: nama, email, password, nomor_wa) & Welcome Email
      try {
        console.log('[Auth] Mengirim data pendaftaran ke Make.com Webhook...');
        sendRegistrationToMakeWebhook({
          nama: regName,
          email: regEmail,
          password: regPassword,
          nomor_wa: regPhone,
        }).catch((hookErr) => {
          console.warn('[Auth] Gagal kirim ke Make.com Webhook:', hookErr);
        });

        // Trigger Welcome Email & WhatsApp Otomatis
        await sendWelcomeEmailAutomation({
          name: regName,
          email: regEmail,
          phone: regPhone,
          nama: regName,
          password: regPassword,
          nomor_wa: regPhone,
        });
      } catch (authDispatchErr) {
        console.warn('[Auth] Notifikasi pendaftaran mengalami kendala:', authDispatchErr);
      }

      setSuccessMessage(`Selamat ${regName}, pendaftaran akun berhasil! Data telah terkirim. Happy shopping! 🎉`);

      const authenticatedUser: UserProfile = {
        id: `user-${Date.now()}`,
        name: regName,
        role: 'buyer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        email: regEmail,
        phone: regPhone,
        city: 'Jakarta Selatan',
        freeListingUsed: false,
        listingQuota: 1, // Bonus 1 kuota gratis untuk pendaftar baru
        activeListingCount: 0,
        permissions: {
          locationGranted: false,
          cameraGalleryGranted: false,
        },
      };

      // Tampilkan notifikasi "happy shopping" sejenak sebelum modal ditutup
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(authenticatedUser);
        onClose();
      }, 1200);
    } else {
      // Mode Login
      const isValid = validateLogin();
      if (!isValid) return;

      setIsLoading(true);

      const ident = loginIdentifier.trim();
      const isEmail = ident.includes('@');

      let userFromDb: any = null;
      if (isEmail) {
        try {
          userFromDb = await fetchUserByEmailFromSupabase(ident);
        } catch (e) {
          console.warn('[Auth] Supabase lookup error:', e);
        }
      }

      const loggedUser: UserProfile = {
        id: userFromDb?.id || `user-${Date.now()}`,
        name: userFromDb?.name || (isEmail ? ident.split('@')[0] : 'Member JualRugi'),
        role: (userFromDb?.role as any) || 'buyer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        email: userFromDb?.email || (isEmail ? ident : `${ident.replace(/\D/g, '')}@jualrugi.my.id`),
        phone: userFromDb?.whatsapp || userFromDb?.phone || (!isEmail ? ident : '0812-3344-5566'),
        city: userFromDb?.city || 'Jakarta Selatan',
        freeListingUsed: false,
        listingQuota: userFromDb?.listing_quota ?? 1,
        activeListingCount: 0,
        permissions: {
          locationGranted: false,
          cameraGalleryGranted: false,
        },
      };

      setIsLoading(false);
      onLoginSuccess(loggedUser);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-100 shadow-2xl my-auto p-5 sm:p-6 text-slate-800 max-h-[94vh] overflow-y-auto">
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-sky-50 mb-2 border border-sky-100">
            <BrandLogo size="sm" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {mode === 'register' ? 'Daftar Akun Baru' : 'Masuk ke Akun Anda'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'register'
              ? 'Lengkapi form di bawah untuk mulai pasang iklan & transaksi COD aman.'
              : 'Silakan masukkan kredensial akun Anda yang terdaftar.'}
          </p>
        </div>

        {/* Tab Pilihan: Daftar vs Masuk */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-4 border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            className={`py-2 text-xs font-black rounded-xl transition cursor-pointer ${
              mode === 'register'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar Akun Baru
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            className={`py-2 text-xs font-black rounded-xl transition cursor-pointer ${
              mode === 'login'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Masuk / Login
          </button>
        </div>

        {/* Banner Info Kuota Iklan Gratis saat Registrasi */}
        {mode === 'register' && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-950 mb-4 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 text-sm shadow-xs">
                🎁
              </span>
              <div>
                <p className="text-xs font-black text-emerald-950 leading-tight">
                  Bonus 1 Kuota Iklan Gratis
                </p>
                <p className="text-[10px] text-emerald-700 font-medium">
                  Welcome email &amp; link grup WhatsApp resmi dikirim otomatis ke email Anda
                </p>
              </div>
            </div>
            {onOpenWelcomeEmailSetup && (
              <button
                type="button"
                onClick={onOpenWelcomeEmailSetup}
                className="shrink-0 text-[10px] font-bold text-sky-700 hover:text-sky-900 bg-white px-2 py-1 rounded-lg border border-sky-200 transition cursor-pointer"
                title="Status Brevo Email"
              >
                Status
              </button>
            )}
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mb-4 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {generalError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* FORM REGISTRASI MANUAL (TANPA GOOGLE SIGN-IN)            */}
        {/* ======================================================== */}
        {mode === 'register' ? (
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {/* 1. Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Contoh: Rian Pratama"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 outline-none transition ${
                    errors.name
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* 2. Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Contoh: namaanda@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 outline-none transition ${
                    errors.email
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                  }`}
                />
              </div>
              {errors.email ? (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Digunakan untuk menerima notifikasi iklan tayang dan welcome email.
                </p>
              )}
            </div>

            {/* 3. Kata Sandi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 outline-none transition ${
                    errors.password
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* 4. Nomor WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="whatsapp"
                  required
                  placeholder="Contoh: 0821xxxxxxxx atau 628xxxxxxx"
                  value={whatsapp}
                  onChange={handleWhatsAppInput}
                  maxLength={14}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-slate-900 outline-none transition ${
                    errors.whatsapp
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                  }`}
                />
              </div>
              {errors.whatsapp ? (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.whatsapp}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Hanya angka format 0821xxxxxxxx atau 628xxxxxxx
                </p>
              )}
            </div>

            {/* Syarat & Ketentuan / Disclaimer Transaksi */}
            <div className="pt-1">
              <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-3.5 text-slate-800 text-xs shadow-2xs">
                <div className="flex items-center gap-1.5 pb-2 border-b border-amber-200/80 text-amber-950 font-extrabold">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] sm:text-xs uppercase tracking-wide">
                    Disclaimer Transaksi COD 100% Aman
                  </span>
                </div>

                <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-slate-700">
                  <p>
                    • Transaksi dilakukan langsung antara penjual &amp; pembeli secara <strong>COD tatap muka</strong> di ruang publik.
                  </p>
                  <p>
                    • <strong>Dilarang mentransfer DP</strong> kepada siapapun sebelum melihat dan mengecek langsung fisik barang.
                  </p>
                  <p>
                    • <strong className="text-amber-950">jualrugi.my.id</strong> merupakan penyedia ruang iklan dan tidak bertanggung jawab atas kerugian akibat transfer uang muka di luar ketentuan COD.
                  </p>
                </div>

                {/* Checkbox Persetujuan */}
                <label className="flex items-start gap-2.5 mt-3 pt-2.5 border-t border-amber-200 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    name="disclaimerAgreement"
                    required
                    checked={agreedToDisclaimer}
                    onChange={(e) => {
                      setAgreedToDisclaimer(e.target.checked);
                      if (e.target.checked && errors.disclaimer) {
                        setErrors((prev) => ({ ...prev, disclaimer: '' }));
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-amber-400 text-sky-600 focus:ring-sky-500 shrink-0 cursor-pointer accent-sky-600"
                  />
                  <span className="text-[11px] font-bold text-slate-900 leading-snug group-hover:text-amber-950">
                    Saya menyetujui seluruh Syarat, Ketentuan &amp; Disclaimer Transaksi di atas. <span className="text-rose-500">*</span>
                  </span>
                </label>
              </div>

              {errors.disclaimer && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.disclaimer}</span>
                </p>
              )}
            </div>

            {/* Tombol Submit Registrasi */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 transition cursor-pointer mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses Pendaftaran...</span>
                </>
              ) : (
                <>
                  <span>Daftar Akun Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ======================================================== */
          /* FORM LOGIN MANUAL                                        */
          /* ======================================================== */
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email atau Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="loginIdentifier"
                  required
                  placeholder="nama@email.com atau 0821xxxxxxxx"
                  value={loginIdentifier}
                  onChange={(e) => {
                    setLoginIdentifier(e.target.value);
                    if (errors.loginIdentifier) {
                      setErrors((prev) => ({ ...prev, loginIdentifier: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 outline-none transition ${
                    errors.loginIdentifier
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                  }`}
                />
              </div>
              {errors.loginIdentifier && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.loginIdentifier}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  name="loginPassword"
                  required
                  placeholder="Masukkan kata sandi Anda"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (errors.loginPassword) {
                      setErrors((prev) => ({ ...prev, loginPassword: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 outline-none transition ${
                    errors.loginPassword
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.loginPassword && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.loginPassword}</span>
                </p>
              )}
            </div>

            {/* Tombol Submit Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 transition cursor-pointer mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Note */}
        <p className="text-[10px] text-slate-400 text-center mt-4">
          Dengan melanjutkan, Anda menyetujui Ketentuan Layanan &amp; Protokol Transaksi COD Aman JualRugi.my.id.
        </p>
      </div>
    </div>
  );
};
