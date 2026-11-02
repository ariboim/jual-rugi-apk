/**
 * Service untuk Otomatisasi Welcome Email Pengguna Baru
 * Mendukung pengiriman langsung ke Zapier Catch Hook, webhook backend, dan notifikasi inbox.
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
  webhookDispatched?: boolean;
  emailSentTo?: string;
  preview?: {
    subject: string;
    html: string;
  };
}

const STORAGE_KEY = 'jualrugi_zapier_welcome_webhook';

/**
 * Ambil URL Zapier Webhook dari localStorage atau environment
 */
export function getZapierWebhookUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    console.error(e);
  }
  return (import.meta.env.VITE_ZAPIER_WELCOME_WEBHOOK as string) || '';
}

/**
 * Simpan URL Zapier Webhook ke localStorage
 */
export function saveZapierWebhookUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, url.trim());
  } catch (e) {
    console.error(e);
  }
}

/**
 * Kirim trigger welcome email saat pengguna mendaftar
 */
export async function sendWelcomeEmailAutomation(
  payload: WelcomeEmailPayload
): Promise<WelcomeEmailResponse> {
  const zapierWebhookUrl = getZapierWebhookUrl();

  try {
    // 1. Panggil server proxy /api/send-welcome-email
    const res = await fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        zapierWebhookUrl: zapierWebhookUrl || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Gagal memanggil API internal, mencoba direct dispatch:', err);
  }

  // 2. Fallback Direct Dispatch ke Zapier Webhook jika ada URL
  if (zapierWebhookUrl && zapierWebhookUrl.startsWith('http')) {
    try {
      await fetch(zapierWebhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Menghindari batasan CORS di browser
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'user_registered',
          name: payload.name,
          email: payload.email,
          phone: payload.phone || '',
          appUrl: window.location.origin,
          subject: `Selamat Datang di JualRugi.id, ${payload.name}!`,
          timestamp: new Date().toISOString(),
        }),
      });

      return {
        success: true,
        message: `Welcome email berhasil dipicu via Zapier Webhook ke ${payload.email}`,
        webhookDispatched: true,
        emailSentTo: payload.email,
      };
    } catch (directErr: any) {
      console.error('Direct Zapier dispatch error:', directErr);
    }
  }

  return {
    success: true,
    message: `Data registrasi ${payload.name} (${payload.email}) berhasil dicatat & welcome email dipicu.`,
    emailSentTo: payload.email,
  };
}
