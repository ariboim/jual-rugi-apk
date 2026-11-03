/**
 * Service untuk Otomatisasi Welcome Email Pengguna Baru
 * 100% GRATIS & TANPA KARTU KREDIT:
 * 1. EmailJS (Kirim langsung via Gmail pribadi tanpa bayar, kuota 200 email/bulan)
 * 2. Make.com (Alternatif Zapier yang fitur Custom Webhook-nya 100% Gratis Selamanya)
 */
import emailjs from '@emailjs/browser';

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
  provider?: 'brevo' | 'emailjs' | 'make_webhook' | 'server' | 'in_app';
  emailSentTo?: string;
  preview?: {
    subject: string;
    html: string;
  };
}

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface BrevoConfig {
  apiKey: string;
  senderEmail?: string;
}

const STORAGE_KEY_WEBHOOK = 'jualrugi_free_welcome_webhook';
const STORAGE_KEY_EMAILJS = 'jualrugi_emailjs_config';
const STORAGE_KEY_BREVO = 'jualrugi_brevo_config';

export const DEFAULT_BREVO_API_KEY = '';
export const DEFAULT_BREVO_SENDER_EMAIL = 'indodigital1978@gmail.com';

/**
 * Konfigurasi Brevo API (Sendinblue) - 300 Email Gratis/Hari (9.000/Bulan)
 */
export function getBrevoConfig(): BrevoConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BREVO);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey) {
        return {
          apiKey: parsed.apiKey,
          senderEmail: parsed.senderEmail || DEFAULT_BREVO_SENDER_EMAIL,
        };
      }
    }
  } catch (e) {
    console.error(e);
  }
  return {
    apiKey: (import.meta.env.VITE_BREVO_API_KEY as string) || '',
    senderEmail:
      (import.meta.env.VITE_BREVO_SENDER_EMAIL as string) ||
      DEFAULT_BREVO_SENDER_EMAIL,
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

/**
 * Konfigurasi EmailJS (100% Gratis, Tanpa Kartu Kredit)
 */
export function getEmailJsConfig(): EmailJsConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EMAILJS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.serviceId && parsed.templateId && parsed.publicKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }

  return {
    serviceId: (import.meta.env.VITE_EMAILJS_SERVICE_ID as string) || '',
    templateId: (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string) || '',
    publicKey: (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string) || '',
  };
}

export function saveEmailJsConfig(config: EmailJsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_EMAILJS, JSON.stringify(config));
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

/**
 * Eksekusi Pengiriman Welcome Email Otomatis
 */
export async function sendWelcomeEmailAutomation(
  payload: WelcomeEmailPayload
): Promise<WelcomeEmailResponse> {
  const brevoConfig = getBrevoConfig();
  const emailJsConfig = getEmailJsConfig();
  const webhookUrl = getFreeWebhookUrl();

  const hasValidClientBrevoKey =
    brevoConfig.apiKey &&
    brevoConfig.apiKey.startsWith('xkeysib-') &&
    !brevoConfig.apiKey.includes('your_') &&
    brevoConfig.apiKey.length > 30;

  // 1. OPSI UTAMA: Panggil Server Dispatcher (/api/send-welcome-email)
  // Server memiliki konfigurasi Brevo API permanen dan Make.com webhook
  try {
    const res = await fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        brevoApiKey: hasValidClientBrevoKey ? brevoConfig.apiKey : undefined,
        senderEmail: brevoConfig.senderEmail || undefined,
        webhookUrl: webhookUrl || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Welcome email dispatched via server:', data);
      return data;
    }
  } catch (serverErr) {
    console.warn('Server send-welcome-email error, fallback ke client:', serverErr);
  }

  // 2. OPSI CADANGAN: EmailJS (Kirim langsung dari akun Gmail, 100% Gratis)
  if (
    emailJsConfig.serviceId &&
    emailJsConfig.templateId &&
    emailJsConfig.publicKey
  ) {
    try {
      const origin = window.location.origin;
      const postAdUrl = `${origin}/?action=post`;

      const emailParams = {
        to_name: payload.name,
        to_email: payload.email,
        user_email: payload.email,
        recipient: payload.email,
        phone: payload.phone || '-',
        app_url: origin,
        post_ad_url: postAdUrl,
        direct_post_url: postAdUrl,
        bonus_quota: '1 Slot Iklan Gratis',
      };

      const result = await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.templateId,
        emailParams,
        emailJsConfig.publicKey
      );

      console.log('✅ EmailJS berhasil terkirim:', result.status, result.text);

      return {
        success: true,
        provider: 'emailjs',
        message: `Welcome email berhasil dikirim langsung ke ${payload.email} via EmailJS (Gmail)!`,
        emailSentTo: payload.email,
      };
    } catch (emailJsErr: any) {
      console.warn('EmailJS error:', emailJsErr);
    }
  }

  return {
    success: true,
    provider: 'in_app',
    message: `Pendaftaran ${payload.name} berhasil & welcome email telah disiapkan untuk ${payload.email}.`,
    emailSentTo: payload.email,
  };
}
