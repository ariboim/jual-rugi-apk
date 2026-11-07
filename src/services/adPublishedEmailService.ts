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
// [1. KONFIGURASI URL IKLAN LANGSUNG]
// Format resmi: https://jualrugi.my.id/?id={id_iklan} (juga mendukung ?deal={id})
// =============================================================================
export const AD_BASE_URL = 'https://jualrugi.my.id';

/**
 * Menghasilkan link langsung iklan berdasarkan ID listing
 * @param listingId ID unik dari iklan yang tayang
 */
export function getDynamicAdLink(listingId: string): string {
  const cleanId = (listingId || 'demo').trim();
  return `${AD_BASE_URL}/?id=${encodeURIComponent(cleanId)}`;
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
 * Silakan cek iklan Anda melalui link berikut: https://jualrugi.my.id/?id={id_iklan}"
 */
export function generateAdPublishedEmailContent(listingId: string, listingTitle?: string) {
  const adLink = getDynamicAdLink(listingId);

  // Body Teks Murni (Plain Text)
  const textContent = `Selamat, iklan Anda telah tayang!\n\nJudul: "${listingTitle || 'Produk JualRugi'}"\nSilakan cek iklan Anda melalui link berikut:\n${adLink}`;

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
        <a href="${adLink}" style="color: #0284c7; font-weight: bold; word-break: break-all;">${adLink}</a>
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

export interface AdPublishedEmailPayload {
  listingId: string;
  listingTitle: string;
  recipientEmail: string;
  recipientName?: string;
  sellingPrice?: number;
  category?: string;
  subject?: string;
}

/**
 * Mengirimkan Email Notifikasi "Iklan Tayang" setelah moderasi selesai
 * @param payload Detail iklan dan email penerima (Default Subject: "Iklan Tayang")
 */
export async function triggerAdPublishedEmail(
  payload: AdPublishedEmailPayload
): Promise<AdPublishedEmailResponse> {
  const { listingId, listingTitle, recipientEmail, recipientName, subject } = payload;
  const emailSubject = subject || 'Iklan Tayang';
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
    subject: emailSubject,
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

  // 1. Prioritas Utama: Kirim via endpoint proxy server Express (/api/send-ad-published-email)
  try {
    const serverRes = await fetch('/api/send-ad-published-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId,
        listingTitle,
        recipientEmail,
        recipientName,
        sellingPrice: payload.sellingPrice,
        category: payload.category,
        subject: emailSubject,
      }),
    });

    if (serverRes.ok) {
      const serverData = await serverRes.json();
      console.log('✅ [Ad Published Email] Berhasil dikirim via server/Cloudflare Pages:', serverData);
      return {
        success: true,
        message: serverData.message || `Email notifikasi "Iklan Tayang" berhasil dikirim ke ${recipientEmail}`,
        sentTo: recipientEmail,
        listingId,
        adLink,
        provider: serverData.provider || 'brevo',
        messageId: serverData.messageId,
      };
    } else {
      const errData = await serverRes.json().catch(() => ({}));
      console.warn(`⚠️ [Ad Published Email] Server / Cloudflare Pages merespons status ${serverRes.status}:`, errData);
      if (errData && errData.error) {
        console.error('❌ [Ad Published Email Error Detail]:', errData.error, errData.debugInfo || '');
      }
    }
  } catch (serverErr) {
    console.warn('⚠️ [Ad Published Email] Server proxy email unreachable, mencoba direct dispatch:', serverErr);
  }

  // 2. Eksekusi fallback pengiriman direct client via Brevo Transactional Email API
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
          subject: emailSubject,
          htmlContent,
          textContent,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log('✅ Email notifikasi "Iklan Tayang" berhasil dikirim via Brevo direct:', data);
        return {
          success: true,
          message: `Email notifikasi "${emailSubject}" berhasil dikirim ke ${recipientEmail}`,
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
      console.warn('Gagal memanggil Brevo API direct:', apiErr);
    }
  }

  // 3. Fallback mode simulasi
  console.log('📧 Notifikasi email "Iklan Tayang" tercatat di sistem:', {
    to: recipientEmail,
    subject: emailSubject,
    adLink,
    textContent,
  });

  return {
    success: true,
    message: `Notifikasi "Iklan Tayang" tercatat untuk ${recipientEmail} (Link: ${adLink})`,
    sentTo: recipientEmail,
    listingId,
    adLink,
    provider: 'simulation_fallback',
  };
}

export interface MonetizationEmailPayload {
  listingId: string;
  listingTitle: string;
  recipientEmail: string;
  recipientName?: string;
  packageType: 'sundul' | 'prioritas';
}

/**
 * Mengirimkan Email Notifikasi saat Admin Mengaktifkan Paket Sundul / BU Prioritas
 * Sesuai format wajib:
 * "Selamat, iklan [sundul/prioritas] Anda sudah aktif! Silakan cek iklan Anda melalui: https://jualrugi.my.id/?id={id_iklan}"
 */
export async function triggerMonetizationActivatedEmail(
  payload: MonetizationEmailPayload
): Promise<AdPublishedEmailResponse> {
  const { listingId, listingTitle, recipientEmail, recipientName, packageType } = payload;
  const adLink = getDynamicAdLink(listingId);
  const packageLabel = packageType === 'sundul' ? 'sundul' : 'prioritas';
  const packageName = packageType === 'sundul' ? 'Sundul Iklan (#1 Feed)' : 'BU Prioritas (Highlight Emas)';

  const textContent = `Selamat, iklan ${packageLabel} Anda sudah aktif!\n\nProduk: "${listingTitle}"\nSilakan cek iklan Anda melalui: ${adLink}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Iklan ${packageName} Aktif - JualRugi.my.id</title>
</head>
<body style="margin:0;padding:24px;background-color:#f0f9ff;font-family:sans-serif;color:#0f172a;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #bae6fd;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <div style="text-align:center;margin-bottom:20px;">
      <span style="display:inline-block;background:#e0f2fe;color:#0284c7;padding:4px 14px;border-radius:9999px;font-size:12px;font-weight:bold;text-transform:uppercase;">
        Pembayaran Terverifikasi Admin
      </span>
      <h2 style="color:#0369a1;margin:12px 0 6px;">Selamat, iklan ${packageLabel} Anda sudah aktif! 🎉</h2>
      <p style="font-weight:600;color:#334155;margin:4px 0;">"${listingTitle}"</p>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#334155;">
      Status paket <strong>${packageName}</strong> telah resmi diaktifkan oleh Admin JualRugi setelah verifikasi bukti pembayaran Mayar.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${adLink}" style="display:inline-block;background:#0284c7;color:#ffffff;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Cek Iklan Anda Sekarang
      </a>
      <div style="margin-top:14px;font-size:12px;color:#64748b;word-break:break-all;">
        Silakan cek iklan Anda melalui link langsung: <br/>
        <a href="${adLink}" style="color:#0284c7;font-weight:bold;">${adLink}</a>
      </div>
    </div>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
      JualRugi.my.id • Sistem Notifikasi Status Iklan Otomatis
    </div>
  </div>
</body>
</html>
  `.trim();

  const brevoConfig = getBrevoConfig();
  const apiKey = brevoConfig.apiKey || DEFAULT_BREVO_API_KEY;
  const senderEmail = brevoConfig.senderEmail || DEFAULT_BREVO_SENDER_EMAIL;
  const senderName = brevoConfig.senderName || DEFAULT_BREVO_SENDER_NAME;

  const logEntry = {
    id: `email-monetize-${Date.now()}`,
    listingId,
    listingTitle,
    recipientEmail,
    packageType,
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
    console.warn('Gagal menyimpan log email aktivasi ke localStorage:', e);
  }

  if (apiKey && apiKey.startsWith('xkeysib-') && recipientEmail && recipientEmail.includes('@')) {
    try {
      const response = await fetch(EMAIL_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: recipientEmail.trim(), name: recipientName || 'Pengiklan JualRugi' }],
          subject: `Iklan ${packageLabel} Anda Sudah Aktif - JualRugi.my.id`,
          htmlContent,
          textContent,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: true,
          message: `Email aktivasi ${packageLabel} berhasil dikirim ke ${recipientEmail}`,
          sentTo: recipientEmail,
          listingId,
          adLink,
          provider: 'brevo',
          messageId: data.messageId,
        };
      }
    } catch (apiErr) {
      console.warn('Gagal memanggil Brevo API untuk aktivasi:', apiErr);
    }
  }

  return {
    success: true,
    message: `Notifikasi aktivasi ${packageLabel} tercatat untuk ${recipientEmail}`,
    sentTo: recipientEmail,
    listingId,
    adLink,
    provider: 'simulation_fallback',
  };
}

