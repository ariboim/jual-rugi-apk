import React, { useState } from 'react';
import { Mail, MapPin, ShieldCheck, Copy, Check, ExternalLink, Users } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const companyAddress = 'Jl. Pangkalan 6 Raya No. 16, RT 003/RW 004, Ciketing, Bekasi 17153';
  const whatsappNumber = '089673686625';
  const whatsappUrl = 'https://wa.me/6289673686625?text=Halo%20Admin%20JualRugi.my.id%2C%20saya%20butuh%20bantuan%20terkait%20platform.';
  const contactEmail = 'admin@jualrugi.my.id';

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(companyAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(whatsappNumber);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 transition-colors pt-12 pb-28 sm:pb-12 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-slate-800">
          
          {/* Kolom 1: Brand & Filosofi Marketplace (5 Kolom di Desktop) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <BrandLogo size="md" variant="dark" />
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              Platform bursa jual-beli barang bekas butuh uang (BU) cepat dengan harga diskon ekstrem. Mengedepankan transaksi <strong>100% COD tatap muka</strong> di ruang publik yang aman tanpa risiko transfer uang muka (DP).
            </p>

            {/* Badge Jaminan Keamanan */}
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sky-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Verifikasi Moderasi Ketat &amp; Anti-Penipuan COD</span>
            </div>
          </div>

          {/* Kolom 2: Kontak Langsung (4 Kolom di Desktop) */}
          <div className="md:col-span-4 space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Hubungi Layanan Admin
            </h4>

            <div className="space-y-2.5 text-xs">
              {/* WhatsApp Admin Card */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3 rounded-2xl bg-slate-800/70 hover:bg-emerald-950/40 border border-slate-700/70 hover:border-emerald-500/50 transition-all shadow-xs"
                title="Buka Chat WhatsApp Resmi Admin"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    {/* SVG Ikon Resmi WhatsApp */}
                    <svg
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">WhatsApp Admin Resmi</span>
                    <span className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition font-mono tracking-wide">
                      {whatsappNumber}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyPhone}
                    title="Salin Nomor WhatsApp"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
                  >
                    {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                </div>
              </a>

              {/* WhatsApp Community Group Card */}
              <a
                href="https://chat.whatsapp.com/Be6mlNR46KKCsqcNh3Wnvi?s=cl&p=a&mlu=4&ilr=4&iam=2"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/70 hover:border-emerald-500/70 transition-all shadow-xs"
                title="Gabung Grup Komunitas WhatsApp JualRugi"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-emerald-300/80 font-medium">Grup Komunitas WhatsApp</span>
                    <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-emerald-300 transition">
                      Gabung Komunitas JualRugi
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-400/80 group-hover:text-emerald-300 transition" />
              </a>

              {/* Email Kontak Card */}
              <a
                href={`mailto:${contactEmail}`}
                className="group flex items-center justify-between p-3 rounded-2xl bg-slate-800/70 hover:bg-sky-950/40 border border-slate-700/70 hover:border-sky-500/50 transition-all shadow-xs"
                title="Kirim Email ke Admin JualRugi"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Mail className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">Email Kontak Resmi</span>
                    <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-sky-400 transition font-mono">
                      {contactEmail}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition" />
              </a>
            </div>
          </div>

          {/* Kolom 3: Alamat Perusahaan & Lokasi Operasional (3 Kolom di Desktop) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Alamat Operasional
            </h4>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <address className="not-italic text-xs text-slate-300 leading-relaxed font-normal">
                  {companyAddress}
                </address>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleCopyAddress}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin Alamat</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 transition"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Powered by IndoDigital */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="text-center sm:text-left text-slate-400 font-medium">
            © 2026 <span className="font-bold text-slate-300">jualrugi.my.id</span>. Powered by <span className="font-extrabold text-sky-400">IndoDigital</span>.
          </p>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Transaksi COD 100% Aman</span>
            <span>•</span>
            <span>Tanpa Biaya Admin</span>
            <span>•</span>
            <span>Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
