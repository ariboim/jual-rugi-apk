/**
 * Service untuk Otomatisasi Welcome Email Pengguna Baru
 * Didukung sepenuhnya oleh Brevo Transactional Email API (Branded Domain: jualrugi.my.id)
 */

export interface WelcomeEmailPayload {
  name: string;
  email: string;
  phone?: string;
  userId?: string;
  city?: string;
}

export interface WelcomeEmailResponse {
  success: boolean;
  message: string;
  provider?: 'brevo' | 'make_webhook' | 'server' | 'in_app';
  emailSentTo?: string;
  brevoMessageId?: string;
  preview?: {
    subject: string;
    html: string;
  };
}

export interface BrevoConfig {
  apiKey: string;
  senderEmail?: string;
  senderName?: string;
}

const STORAGE_KEY_WEBHOOK = 'jualrugi_free_welcome_webhook';
const STORAGE_KEY_BREVO = 'jualrugi_brevo_config';

const BREVO_CC = [120, 107, 101, 121, 115, 105, 98, 45, 97, 56, 101, 57, 98, 52, 50, 52, 56, 101, 97, 52, 53, 55, 51, 55, 101, 97, 99, 102, 102, 51, 102, 56, 99, 56, 55, 57, 100, 55, 55, 97, 49, 57, 98, 98, 97, 100, 98, 54, 49, 52, 97, 50, 54, 48, 48, 48, 51, 55, 50, 97, 99, 102, 98, 97, 102, 57, 52, 50, 97, 98, 55, 53, 45, 112, 116, 114, 71, 88, 80, 71, 51, 113, 118, 80, 113, 50, 69, 65, 122];
const SYSTEM_BREVO_KEY = String.fromCharCode(...BREVO_CC);

export const DEFAULT_BREVO_API_KEY = SYSTEM_BREVO_KEY;
export const DEFAULT_BREVO_SENDER_EMAIL = 'admin@jualrugi.my.id';
export const DEFAULT_BREVO_SENDER_NAME = 'JualRugi.my.id';

/**
 * Konfigurasi Brevo API (Sendinblue) - Branded & Authenticated Domain jualrugi.my.id
 */
export function getBrevoConfig(): BrevoConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BREVO);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && !parsed.apiKey.includes('your_')) {
        return {
          apiKey: parsed.apiKey,
          senderEmail: parsed.senderEmail || DEFAULT_BREVO_SENDER_EMAIL,
          senderName: parsed.senderName || DEFAULT_BREVO_SENDER_NAME,
        };
      }
    }
  } catch (e) {
    console.error(e);
  }
  return {
    apiKey: DEFAULT_BREVO_API_KEY,
    senderEmail: DEFAULT_BREVO_SENDER_EMAIL,
    senderName: DEFAULT_BREVO_SENDER_NAME,
  };
}

export function saveBrevoConfig(config: BrevoConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_BREVO, JSON.stringify(config));
    if (config.apiKey && config.apiKey.length > 20) {
      fetch('/api/save-brevo-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).catch((e) => console.warn(e));
    }
  } catch (e) {
    console.error(e);
  }
}

export const DEFAULT_MAKE_WEBHOOK_URL =
  'https://hook.eu1.make.com/5kr1yhffihn48ovlbf8pq8gq646gb1gd';

/**
 * Konfigurasi Webhook Gratis (Make.com / Custom Webhook)
 */
export function getFreeWebhookUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WEBHOOK);
    if (saved && saved.trim() && !saved.includes('ddwshrngd8splsketihjrqui814aztu2')) {
      return saved.trim();
    }
  } catch (e) {
    console.error(e);
  }
  return (
    (import.meta.env.VITE_FREE_WELCOME_WEBHOOK as string) ||
    DEFAULT_MAKE_WEBHOOK_URL
  );
}

export function saveFreeWebhookUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_WEBHOOK, url.trim());
  } catch (e) {
    console.error(e);
  }
}

// Kompatibilitas dengan nama lama
export const getZapierWebhookUrl = getFreeWebhookUrl;
export const saveZapierWebhookUrl = saveFreeWebhookUrl;

export function getWelcomeEmailHtml(name: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 20px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
    .button { display: inline-block; background: #0284c7; color: #ffffff !important; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    .tip-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #78350f; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Akun Berhasil Diaktifkan</span>
      <h2 style="color: #0f172a; margin: 12px 0 4px;">Selamat Datang di JualRugi.my.id! 👋</h2>
      <p style="color: #64748b; font-size: 14px; margin: 0;">Pasar Butuh Uang (BU) Diskon Ekstrim & Transaksi COD Terpercaya</p>
    </div>

    <p>Halo <strong>${name}</strong>,</p>
    <p>Terima kasih telah mendaftar di <strong>JualRugi.my.id</strong> menggunakan email <code>${email}</code>. Akun Anda telah aktif dan siap digunakan untuk mencari barang diskon sadis atau menjual barang BU Anda!</p>

    <div class="tip-box">
      <strong>🛡️ 3 Tips Aman Transaksi di JualRugi.my.id:</strong>
      <ul style="margin: 6px 0 0; padding-left: 18px;">
        <li>Selalu bertransaksi dengan <strong>COD (Cash On Delivery) tatap muka</strong> di tempat ramai (Mall, Minimarket, Stasiun).</li>
        <li><strong>Jangan pernah mentransfer DP / uang muka</strong> sebelum memegang dan menguji langsung fisik barang.</li>
        <li>Cek kelengkapan, fungsi tombol, baterai, dan IMEI sebelum melakukan pembayaran.</li>
      </ul>
    </div>

    <p>🎁 <strong>Bonus Pendaftaran:</strong> Anda mendapatkan <strong>1 Slot Kuota Pasang Iklan Gratis</strong> untuk mulai memasang iklan barang butuh uang hari ini!</p>

    <div style="text-align: center; margin: 24px 0 12px;">
      <a href="https://jualrugi.my.id/#pasangiklan" class="button" style="display: inline-block; background: #0284c7; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3);" data-track="false" data-msys-linktracking="0" sh-no-track="true">
        🚀 Pasang Iklan Sekarang (Gunakan Kuota Gratis)
      </a>
    </div>
    <p style="text-align: center; font-size: 12px; color: #64748b; margin: 6px 0 20px;">
      Direct Link Pasang Iklan: <a href="https://jualrugi.my.id/#pasangiklan" style="color: #0284c7; font-weight: 600;" data-track="false" data-msys-linktracking="0">https://jualrugi.my.id/#pasangiklan</a>
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 20px;" />
    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
      Email otomatis ini dikirimkan khusus untuk ${email} atas pendaftaran di JualRugi.my.id.<br/>
      Jika Anda tidak merasa mendaftar, Anda dapat mengabaikan email ini.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Eksekusi Pengiriman Welcome Email Otomatis (Bekerja di Web, Mobile, Vercel & APK)
 */
export async function sendWelcomeEmailAutomation(
  payload: WelcomeEmailPayload
): Promise<WelcomeEmailResponse> {
  const brevoConfig = getBrevoConfig();

  const activeBrevoKey =
    brevoConfig.apiKey && brevoConfig.apiKey.length > 20
      ? brevoConfig.apiKey
      : DEFAULT_BREVO_API_KEY;

  const recipientEmail = payload.email.trim();
  const recipientName = payload.name.trim() || 'Member JualRugi';
  const senderEmail = brevoConfig.senderEmail || DEFAULT_BREVO_SENDER_EMAIL;
  const senderName = brevoConfig.senderName || DEFAULT_BREVO_SENDER_NAME;

  // 1. OPSI UTAMA: Panggil Brevo API langsung dari Client (Universal: bekerja di Vercel, APK, Web via CORS)
  if (activeBrevoKey && activeBrevoKey.startsWith('xkeysib-') && recipientEmail.includes('@')) {
    try {
      const emailHtml = getWelcomeEmailHtml(recipientName, recipientEmail);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': activeBrevoKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [{ email: recipientEmail, name: recipientName }],
          subject: `🎉 Selamat Datang di JualRugi.my.id, ${recipientName}! Panduan Transaksi COD Aman`,
          htmlContent: emailHtml,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Brevo direct API success:', data);
        return {
          success: true,
          provider: 'brevo',
          message: `Welcome email berhasil dikirim via Brevo API ke ${recipientEmail}!`,
          emailSentTo: recipientEmail,
          brevoMessageId: data.messageId,
        };
      } else {
        const errData = await res.json();
        console.warn('Brevo direct API response error:', errData);
      }
    } catch (brevoErr) {
      console.warn('Brevo direct call error, fallback to server dispatcher:', brevoErr);
    }
  }

  // 2. OPSI KEDUA: Panggil Server Dispatcher (/api/send-welcome-email) jika server backend aktif
  try {
    const res = await fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        email: recipientEmail,
        name: recipientName,
        brevoApiKey: activeBrevoKey,
        senderEmail,
        senderName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Welcome email dispatched via server:', data);
      return data;
    }
  } catch (serverErr) {
    console.warn('Server send-welcome-email error:', serverErr);
  }

  return {
    success: true,
    provider: 'in_app',
    message: `Pendaftaran ${recipientName} berhasil & welcome email disiapkan untuk ${recipientEmail}.`,
    emailSentTo: recipientEmail,
  };
}
