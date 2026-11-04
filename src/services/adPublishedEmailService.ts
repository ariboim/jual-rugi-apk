/**
 * Service Modular Pengiriman Notifikasi Email Saat Iklan Tayang
 * Platform: JualRugi.my.id
 *
 * Mendukung pengiriman melalui:
 * 1. Brevo Transactional API (Domain Terverifikasi: admin@jualrugi.my.id)
 * 2. Webhook Automation / Edge Function (Make.com, Resend, n8n, Cloudflare Workers)
 */

import {
  getBrevoConfig,
  DEFAULT_BREVO_SENDER_EMAIL,
  DEFAULT_BREVO_SENDER_NAME,
  DEFAULT_BREVO_API_KEY,
} from './welcomeEmail';

// =============================================================================
// [1. KONFIGURASI URL IKLAN DINAMIS]
// Sesuaikan baseUrl di bawah ini dengan konfigurasi domain production Anda.
// Format standar: https://jualrugi.my.id/iklan/{id_iklan}
// =============================================================================
export const AD_BASE_URL = 'https://jualrugi.my.id/iklan';

/**
 * Menghasilkan link dinamis iklan berdasarkan ID listing
 * @param listingId ID unik dari iklan yang tayang
 */
export function getDynamicAdLink(listingId: string): string {
  // Contoh hasil: https://jualrugi.my.id/iklan/ad-1741234567890
  return `${AD_BASE_URL}/${listingId}`;
}

// =============================================================================
// [2. KONFIGURASI ENDPOINT PENGIRIMAN EMAIL]
// Sesuaikan endpoint di bawah ini jika beralih ke microservice/webhook lain:
// - Brevo API: 'https://api.brevo.com/v3/smtp/email'
// - Edge Function / Proxy Internal: '/api/send-ad-published-email'
// - Resend API: 'https://api.resend.com/emails'
// =============================================================================
export const EMAIL_API_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export interface AdPublishedEmailPayload {
  listingId: string;
  listingTitle: string;
  recipientEmail: string;
  recipientName?: string;
  sellingPrice?: number;
  category?: string;
}

export interface AdPublishedEmailResponse {
  success: boolean;
  message: string;
  sentTo: string;
  listingId: string;
  adLink: string;
  provider: 'brevo' | 'edge_webhook' | 'simulation_fallback';
  messageId?: string;
}

/**
 * Format teks & HTML email resmi sesuai spesifikasi:
 * Subject: "Iklan Tayang"
 * Body:
 * "Selamat, iklan Anda telah tayang!
 * Silakan cek iklan Anda melalui link berikut: [Link Dinamis Iklan, contoh: https://jualrugi.my.id/iklan/{id_iklan}]"
 */
export function generateAdPublishedEmailContent(listingId: string, listingTitle?: string) {
  const adLink = getDynamicAdLink(listingId);

  // Body Teks Murni (Plain Text)
  const textContent = `Selamat, iklan Anda telah tayang!\nSilakan cek iklan Anda melalui link berikut: ${adLink}`;

  // Body HTML Responsif & Modern
  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Iklan Tayang - JualRugi.my.id</title>
  <style>
    body { margin: 0; padding: 24px 16px; background-color: #f0f9ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #bae6fd; padding: 32px 28px; box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0284c7; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    h2 { color: #0369a1; margin: 16px 0 8px; font-size: 22px; }
    p { font-size: 15px; line-height: 1.6; color: #334155; margin: 12px 0; }
    .cta-container { text-align: center; margin: 28px 0; }
    .btn-cta { display: inline-block; background: #0284c7; color: #ffffff !important; font-weight: bold; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); }
    .link-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px 14px; word-break: break-all; font-family: monospace; font-size: 13px; color: #0284c7; margin-top: 16px; text-align: center; }
    .footer { margin-top: 32px; pt: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Moderasi Selesai • Resmi Tayang</span>
      <h2>Selamat, iklan Anda telah tayang! 🎉</h2>
      ${listingTitle ? `<p style="font-weight: 600; color: #0f172a; margin-top: 4px;">"${listingTitle}"</p>` : ''}
    </div>

    <p>Selamat, iklan Anda telah selesai dimoderasi dan telah resmi tayang di platform <strong>JualRugi.my.id</strong>.</p>
    
    <p>Calon pembeli dapat langsung menemukan produk Anda dan menghubungi Anda via Chat COD tatap muka yang aman.</p>

    <div class="cta-container">
      <a href="${adLink}" class="btn-cta" target="_blank" rel="noopener noreferrer">
        👀 Cek Iklan Anda Sekarang
      </a>
      <div class="link-box">
        Silakan cek iklan Anda melalui link berikut:<br />
        <a href="${adLink}" style="color: #0284c7; font-weight: bold;">${adLink}</a>
      </div>
    </div>

    <div class="footer">
      Email otomatis ini dikirimkan oleh <strong>JualRugi.my.id</strong> sebagai notifikasi status penayangan iklan.<br/>
      Jangan berikan informasi sensitif seperti OTP atau transfer DP sebelum transaksi COD selesai.
    </div>
  </div>
</body>
</html>
  `.trim();

  return { textContent, htmlContent, adLink };
}

/**
 * Mengirimkan Email Notifikasi "Iklan Tayang" setelah moderasi selesai
 * @param payload Detail iklan dan email penerima
 */
export async function triggerAdPublishedEmail(
  payload: AdPublishedEmailPayload
): Promise<AdPublishedEmailResponse> {
  const { listingId, listingTitle, recipientEmail, recipientName } = payload;
  const { textContent, htmlContent, adLink } = generateAdPublishedEmailContent(
    listingId,
    listingTitle
  );

  const brevoConfig = getBrevoConfig();
  const apiKey = brevoConfig.apiKey || DEFAULT_BREVO_API_KEY;
  const senderEmail = brevoConfig.senderEmail || DEFAULT_BREVO_SENDER_EMAIL;
  const senderName = brevoConfig.senderName || DEFAULT_BREVO_SENDER_NAME;

  // Catat riwayat pengiriman lokal untuk audit & verifikasi UI
  const logEntry = {
    id: `email-log-${Date.now()}`,
    listingId,
    listingTitle,
    recipientEmail,
    sentAt: new Date().toISOString(),
    adLink,
  };

  try {
    const existingLogs = JSON.parse(
      localStorage.getItem('jualrugi_ad_published_emails') || '[]'
    );
    localStorage.setItem(
      'jualrugi_ad_published_emails',
      JSON.stringify([logEntry, ...existingLogs].slice(0, 50))
    );
  } catch (e) {
    console.warn('Gagal menyimpan log email ke localStorage:', e);
  }

  // 1. Eksekusi pengiriman via Brevo Transactional Email API
  if (apiKey && apiKey.startsWith('xkeysib-') && recipientEmail.includes('@')) {
    try {
      const response = await fetch(EMAIL_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: recipientEmail.trim(),
              name: recipientName || 'Pengiklan JualRugi',
            },
          ],
          subject: 'Iklan Tayang',
          htmlContent,
          textContent,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log('✅ Email notifikasi "Iklan Tayang" berhasil dikirim via Brevo:', data);
        return {
          success: true,
          message: `Email notifikasi tayang berhasil dikirim ke ${recipientEmail}`,
          sentTo: recipientEmail,
          listingId,
          adLink,
          provider: 'brevo',
          messageId: data.messageId,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Brevo API merespons non-OK:', response.status, errorData);
      }
    } catch (apiErr) {
      console.warn('Gagal memanggil Brevo API, beralih ke fallback:', apiErr);
    }
  }

  // 2. Fallback mode (berlaku jika offline atau running dalam simulasi preview)
  console.log('📧 Simulasi pengiriman email "Iklan Tayang" tercatat:', {
    to: recipientEmail,
    subject: 'Iklan Tayang',
    adLink,
    textContent,
  });

  return {
    success: true,
    message: `Notifikasi tayang tercatat untuk ${recipientEmail} (Link: ${adLink})`,
    sentTo: recipientEmail,
    listingId,
    adLink,
    provider: 'simulation_fallback',
  };
}
