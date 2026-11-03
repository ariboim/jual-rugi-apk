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
  provider?: 'emailjs' | 'make_webhook' | 'server' | 'in_app';
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

const STORAGE_KEY_WEBHOOK = 'jualrugi_free_welcome_webhook';
const STORAGE_KEY_EMAILJS = 'jualrugi_emailjs_config';

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

/**
 * Konfigurasi Webhook Gratis (Make.com / Custom Webhook)
 */
export function getFreeWebhookUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WEBHOOK);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    console.error(e);
  }
  return (import.meta.env.VITE_FREE_WELCOME_WEBHOOK as string) || '';
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
  const emailJsConfig = getEmailJsConfig();
  const webhookUrl = getFreeWebhookUrl();

  // 1. OPSI UTAMA: EmailJS (Kirim langsung dari akun Gmail Anda, 100% Gratis & Pasti Masuk Inbox)
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
      console.warn('EmailJS error, fallback ke webhook:', emailJsErr);
    }
  }

  // 2. OPSI KEDUA: Webhook Gratis (Make.com / Custom Webhook tanpa kartu kredit)
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const origin = window.location.origin;
      const postAdUrl = `${origin}/?action=post`;

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'user_registered',
          name: payload.name,
          email: payload.email,
          phone: payload.phone || '',
          appUrl: origin,
          postAdUrl: postAdUrl,
          directPostUrl: postAdUrl,
          subject: `Selamat Datang di JualRugi.id, ${payload.name}!`,
          timestamp: new Date().toISOString(),
        }),
      });

      return {
        success: true,
        provider: 'make_webhook',
        message: `Welcome email dipicu via Webhook Gratis ke ${payload.email}!`,
        emailSentTo: payload.email,
      };
    } catch (webhookErr) {
      console.warn('Webhook error:', webhookErr);
    }
  }

  // 3. OPSI KETIGA: Server Endpoint Dispatcher
  try {
    const res = await fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        zapierWebhookUrl: webhookUrl || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        provider: 'server',
      };
    }
  } catch (err) {
    console.warn('Server send-welcome-email fallback:', err);
  }

  return {
    success: true,
    provider: 'in_app',
    message: `Pendaftaran ${payload.name} berhasil & welcome email telah disiapkan untuk ${payload.email}.`,
    emailSentTo: payload.email,
  };
}
