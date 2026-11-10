/**
 * ============================================================================
 * JUALRUGI.MY.ID - BREVO API v3 WELCOME EMAIL AUTOMATION MICROSERVICE
 * ============================================================================
 * 
 * Spesifikasi & Standar Produksi:
 * 1. Sender Name Lock:
 *    - name  : "JualRugi.my.id"
 *    - email : "info@jualrugi.my.id"
 * 2. Full HTML Email Template:
 *    - 100% Inline CSS (Bulletproof untuk Gmail, Outlook, Apple Mail, Webmail)
 *    - Variabel Dinamis Brevo: {{params.FIRSTNAME}} dan {{params.EMAIL}}
 *    - Badge Status: "Akun Berhasil Diaktifkan"
 *    - Kotak Tips Keamanan Transaksi COD (Yellow Card)
 *    - Bonus Kuota & Tombol CTA Pasang Iklan (Blue Button)
 *    - Kotak Komunitas & Grup WhatsApp Resmi JualRugi (Green Card)
 *    - Footer Branded: "Selamat berbelanja & happy shopping! 🥳"
 * 3. Integrasi:
 *    - Brevo Transactional Email API v3 (POST https://api.brevo.com/v3/smtp/email)
 *    - Brevo Contacts API (POST https://api.brevo.com/v3/contacts)
 * ============================================================================
 */

import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// 1. KONFIGURASI PENGIRIM RESMI (SENDER NAME LOCK)
const SENDER_CONFIG = {
  name: 'JualRugi.my.id',
  email: 'info@jualrugi.my.id',
};

// Ambil API Key Brevo dari Environment Variable
const BREVO_API_KEY = process.env.BREVO_API_KEY || 'xkeysib-YOUR_BREVO_API_KEY_HERE';

/**
 * 2. TEMPLATE HTML WELCOME EMAIL RESMI (INLINE CSS BULLETPROOF)
 * Menggunakan variabel template engine resmi Brevo: {{params.FIRSTNAME}} & {{params.EMAIL}}
 */
export function generateWelcomeEmailHtml() {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Selamat Datang di JualRugi.my.id</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Wrapper Table Utama -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Container Kartu Email (Max Width 580px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header Logo & Brand -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 2px solid #f8fafc;">
              <div style="display: inline-block; background-color: #e0f2fe; color: #0284c7; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                ✓ Akun Berhasil Diaktifkan
              </div>
              <h1 style="color: #0f172a; font-size: 22px; font-weight: 900; margin: 16px 0 6px 0; line-height: 1.3;">
                Selamat Datang di JualRugi.my.id! 👋
              </h1>
              <p style="color: #64748b; font-size: 13px; font-weight: 500; margin: 0; line-height: 1.4;">
                Pasar Butuh Uang (BU) Diskon Ekstrim & Transaksi COD Terpercaya
              </p>
            </td>
          </tr>

          <!-- Konten Utama Body -->
          <tr>
            <td style="padding: 28px 32px 10px 32px; color: #334155; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #0f172a;">
                Halo {{params.FIRSTNAME}},
              </p>
              <p style="margin: 0 0 20px 0; color: #475569;">
                Terima kasih telah mendaftar di <strong>JualRugi.my.id</strong> menggunakan email <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 6px; color: #0284c7; font-weight: 600;">{{params.EMAIL}}</code>. Akun Anda telah aktif dan siap digunakan untuk mencari barang diskon sadis atau menjual barang BU Anda!
              </p>

              <!-- Kotak Tips Keamanan (Yellow Box) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #f59e0b; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-size: 13px; font-weight: 800; color: #92400e; margin-bottom: 8px;">
                      🛡️ 3 Tips Aman Transaksi di JualRugi.my.id:
                    </div>
                    <ol style="margin: 0; padding-left: 18px; color: #78350f; font-size: 13px; line-height: 1.6;">
                      <li style="margin-bottom: 6px;">
                        Selalu bertransaksi dengan <strong>COD (Cash On Delivery) tatap muka</strong> di tempat ramai (Mall, Minimarket, Stasiun).
                      </li>
                      <li style="margin-bottom: 6px;">
                        <strong>Jangan pernah mentransfer DP / uang muka</strong> sebelum memegang dan menguji langsung fisik barang.
                      </li>
                      <li>
                        Cek kelengkapan, fungsi tombol, baterai, dan IMEI sebelum melakukan pembayaran.
                      </li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- Bonus Kuota & Tombol Pasang Iklan -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; text-align: center;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 16px 0; font-size: 13px; color: #0f172a;">
                      🎁 <strong>Bonus Pendaftaran:</strong> Anda mendapatkan <strong>1 Slot Kuota Pasang Iklan Gratis</strong> untuk mulai memasang iklan barang butuh uang hari ini!
                    </p>
                    <!-- CTA Button -->
                    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" style="border-radius: 14px; background-color: #0284c7;">
                          <a href="https://jualrugi.my.id/#pasangiklan" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 14px; background-color: #0284c7; letter-spacing: 0.3px;">
                            🚀 Pasang Iklan Sekarang (Gunakan Kuota Gratis)
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 12px 0 0 0; font-size: 11px; color: #64748b;">
                      Direct Link Pasang Iklan: <a href="https://jualrugi.my.id/#pasangiklan" target="_blank" style="color: #0284c7; text-decoration: underline; font-weight: 600;">https://jualrugi.my.id/#pasangiklan</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Kotak Komunitas & Grup WhatsApp (Green Box) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 16px; margin-bottom: 24px; text-align: center;">
                <tr>
                  <td style="padding: 22px 20px;">
                    <div style="display: inline-block; background-color: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">
                      💬 KOMUNITAS JUALRUGI
                    </div>
                    <h3 style="color: #166534; font-size: 16px; font-weight: 800; margin: 4px 0 8px 0;">
                      Yuk, Gabung di Grup WhatsApp JualRugi.my.id!
                    </h3>
                    <p style="font-size: 13px; line-height: 1.5; color: #14532d; margin: 0 0 16px 0;">
                      Dapatkan info kilat barang BU diskon sadis, tips aman COD tatap muka, dan promosi langsung dengan sesama anggota.
                    </p>
                    <!-- WhatsApp Join Button -->
                    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" style="border-radius: 12px; background-color: #25D366;">
                          <a href="https://chat.whatsapp.com/Be6mlNR46KKcsqcNh3Wnvi" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 13px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 12px; background-color: #25D366;">
                            Gabung Grup WhatsApp Sekarang
                          </a>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top: 12px; font-size: 11px; color: #15803d;">
                      Link alternatif: <a href="https://chat.whatsapp.com/Be6mlNR46KKcsqcNh3Wnvi" target="_blank" style="color: #166534; font-weight: 700; text-decoration: underline;">https://chat.whatsapp.com/Be6mlNR46KKcsqcNh3Wnvi</a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Penutup & Footer Branded -->
              <p style="text-align: center; font-size: 14px; font-weight: 800; color: #0284c7; margin: 24px 0 6px 0;">
                Selamat berbelanja & happy shopping! 🥳
              </p>
              <p style="text-align: center; font-size: 12px; color: #64748b; margin: 0 0 20px 0;">
                Direct Link Pasang Iklan: <a href="https://jualrugi.my.id/#pasangiklan" target="_blank" style="color: #0284c7; font-weight: 600; text-decoration: underline;">https://jualrugi.my.id/#pasangiklan</a>
              </p>
            </td>
          </tr>

          <!-- Footer Copyright & Unsubscribe Note -->
          <tr>
            <td style="padding: 16px 32px 24px 32px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              Email otomatis ini dikirimkan khusus untuk {{params.EMAIL}} atas pendaftaran akun di JualRugi.my.id.<br />
              © 2026 JualRugi.my.id — Platform Jual Beli Barang Butuh Uang (BU) Diskon Sadis & Aman.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 3. FUNGSI DISPATCH EMAIL BREVO API v3 DENGAN SENDER NAME LOCK
 */
export async function sendWelcomeEmailViaBrevo({ firstname, email, phone }) {
  if (!email || !email.includes('@')) {
    throw new Error('Alamat email penerima tidak valid.');
  }

  const cleanName = (firstname || 'Member JualRugi').trim();
  const cleanEmail = email.trim().toLowerCase();

  // A. Tambahkan atau Perbarui Kontak di Brevo CRM
  try {
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        attributes: {
          FIRSTNAME: cleanName,
          SMS: phone ? phone.replace(/\D/g, '') : undefined,
        },
        updateEnabled: true,
      }),
    });
  } catch (contactErr) {
    console.warn('[Brevo Contacts Warning]:', contactErr.message);
  }

  // B. Susun Payload Brevo API v3 Sesuai Spesifikasi Mutlak
  const brevoPayload = {
    // SENDER NAME LOCK (KUNCI MUTLAK)
    sender: {
      name: SENDER_CONFIG.name,    // "JualRugi.my.id"
      email: SENDER_CONFIG.email,  // "info@jualrugi.my.id"
    },
    to: [
      {
        email: cleanEmail,
        name: cleanName,
      },
    ],
    subject: 'Selamat Datang di JualRugi.my.id! 👋 - Panduan Transaksi COD Aman',
    htmlContent: generateWelcomeEmailHtml(),
    // Fallback plain-text
    textContent: `Selamat Datang di JualRugi.my.id! 👋\n\nHalo ${cleanName},\n\nTerima kasih telah mendaftar di JualRugi.my.id menggunakan email ${cleanEmail}.\nAkun Anda telah aktif dan siap digunakan!\n\n3 Tips Aman Transaksi di JualRugi.my.id:\n1. Selalu bertransaksi dengan COD tatap muka di tempat ramai.\n2. Jangan pernah transfer DP / uang muka sebelum cek fisik barang.\n3. Cek kelengkapan, fungsi tombol, baterai, dan IMEI.\n\nBonus Pendaftaran: 1 Slot Kuota Pasang Iklan Gratis!\nPasang iklan sekarang: https://jualrugi.my.id/#pasangiklan\n\nGabung Grup WhatsApp Komunitas:\nhttps://chat.whatsapp.com/Be6mlNR46KKcsqcNh3Wnvi\n\nSelamat berbelanja & happy shopping! 🥳\nTim JualRugi.my.id`,
    // Variabel Parameter Dinamis untuk Brevo Template Engine
    params: {
      FIRSTNAME: cleanName,
      EMAIL: cleanEmail,
    },
  };

  // C. Kirim Request ke Endpoint Brevo v3 SMTP Email
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(brevoPayload),
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Brevo API Error [${response.status}]: ${responseData.message || JSON.stringify(responseData)}`);
  }

  return {
    success: true,
    messageId: responseData.messageId,
    sender: SENDER_CONFIG,
    recipient: { email: cleanEmail, name: cleanName },
    data: responseData,
  };
}

// 4. ENDPOINT API EXPRESS
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { name, firstname, email, phone, nomor_wa } = req.body;
    const result = await sendWelcomeEmailViaBrevo({
      firstname: firstname || name,
      email,
      phone: phone || nomor_wa,
    });
    return res.status(200).json({
      success: true,
      message: 'Welcome email berhasil dikirim melalui Brevo API v3.',
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Terjadi kesalahan saat mengirim welcome email.',
    });
  }
});

// Contoh Jalankan Server (Port 3000 / Environment PORT)
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test' && !process.env.RUNNING_IN_VITE) {
  app.listen(PORT, () => {
    console.log(`[JualRugi Brevo Service] Server berjalan di port ${PORT}`);
    console.log(`[Sender Lock] Name: ${SENDER_CONFIG.name} | Email: ${SENDER_CONFIG.email}`);
  });
}
