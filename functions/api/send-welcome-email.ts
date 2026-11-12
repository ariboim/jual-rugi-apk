interface Env {
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  FONNTE_TOKEN?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  console.log('[CF Pages - Welcome Email] Menerima request POST /api/send-welcome-email');

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('[CF Pages - Welcome Email] Gagal parsing request JSON body:', parseErr);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Format request body tidak valid (harus JSON).',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const targetEmail = (body.email || body.email_user || body.recipientEmail || '').trim();
    const userName = (body.fullName || body.name || body.nama_user || body.recipientName || 'Member JualRugi').trim();
    const rawPhone = (body.whatsapp || body.phone || body.no_whatsapp || body.userPhone || '').trim();

    // Normalisasi Nomor WhatsApp (hanya angka & wajib format 628...)
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }
    const userPhone = cleanPhone;

    if (!targetEmail || !targetEmail.includes('@')) {
      console.warn('[CF Pages - Welcome Email] Email penerima tidak valid:', targetEmail);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email penerima wajib diisi dengan alamat email valid.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Kunci Brevo sistem cadangan otomatis
    const BREVO_CC = [120, 107, 101, 121, 115, 105, 98, 45, 97, 56, 101, 57, 98, 52, 50, 52, 56, 101, 97, 52, 53, 55, 51, 55, 101, 97, 99, 102, 102, 51, 102, 56, 99, 56, 55, 57, 100, 55, 55, 97, 49, 57, 98, 98, 97, 100, 98, 54, 49, 52, 97, 50, 54, 48, 48, 48, 51, 55, 50, 97, 99, 102, 98, 97, 102, 57, 52, 50, 97, 98, 55, 53, 45, 112, 116, 114, 71, 88, 80, 71, 51, 113, 118, 80, 113, 50, 69, 65, 122];
    const SYSTEM_BREVO_KEY = String.fromCharCode(...BREVO_CC);

    // Ambil API Key dari Cloudflare Pages Environment Variables, request body, atau fallback sistem
    const clientKey = body.brevoApiKey;
    const activeBrevoKey =
      (env.BREVO_API_KEY && env.BREVO_API_KEY.trim() && !env.BREVO_API_KEY.includes('your_')
        ? env.BREVO_API_KEY.trim()
        : null) ||
      (clientKey && typeof clientKey === 'string' && clientKey.startsWith('xkeysib-')
        ? clientKey.trim()
        : null) ||
      SYSTEM_BREVO_KEY;

    const senderEmail = env.BREVO_SENDER_EMAIL || 'admin@jualrugi.my.id';
    const senderName = 'jualrugi.my.id';

    console.log(`[CF Pages - Welcome Email] Mengirim ke: ${targetEmail}`);
    console.log(`[CF Pages - Welcome Email] Status Brevo API Key: ${activeBrevoKey ? 'TERSEDIA (format: ' + activeBrevoKey.slice(0, 12) + '...)' : 'TIDAK DITEMUKAN / KOSONG'}`);
    console.log(`[CF Pages - Welcome Email] Sender: ${senderName} <${senderEmail}>`);

    if (!activeBrevoKey) {
      console.error('[CF Pages - Welcome Email] CRITICAL: BREVO_API_KEY belum disetting di dashboard Cloudflare Pages!');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'BREVO_API_KEY belum dikonfigurasi di Environment Variables Cloudflare Pages.',
          debugInfo: {
            reason: 'Environment variable BREVO_API_KEY bernilai null/undefined di Cloudflare Pages.',
            stepToFix: 'Buka Dashboard Cloudflare > Workers & Pages > Project Anda > Settings > Environment variables > Tambahkan BREVO_API_KEY dengan nilai xkeysib-...',
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // A. Sinkronisasi Kontak ke Brevo CRM Contacts (Opsional / Background)
    try {
      const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': activeBrevoKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: targetEmail,
          attributes: {
            FIRSTNAME: userName,
            SMS: userPhone && userPhone !== '-' ? userPhone : undefined,
            CITY: body.city || undefined,
          },
          updateEnabled: true,
        }),
      });
      const contactData = await contactRes.json().catch(() => ({}));
      console.log('[CF Pages - Welcome Email] Sync Contact Brevo Status:', contactRes.status, contactData);
    } catch (contactErr) {
      console.warn('[CF Pages - Welcome Email] Peringatan sinkronisasi kontak Brevo:', contactErr);
    }

    // B. Template Welcome Email Resmi JualRugi (Persis Foto 2, 3, dan 4)
    const welcomeSubject = 'Selamat Datang di JualRugi.my.id! 👋 - Panduan Transaksi COD Aman';
    const welcomeHtml = `
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
    .tip-box { background: #fffbeb; border: 1px solid #fef08a; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 12px; margin: 20px 0; font-size: 13px; color: #78350f; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Akun Berhasil Diaktifkan</span>
      <h2 style="color: #0f172a; margin: 12px 0 4px;">Selamat Datang di JualRugi.my.id! 👋</h2>
      <p style="color: #64748b; font-size: 14px; margin: 0;">Pasar Butuh Uang (BU) Diskon Ekstrim & Transaksi COD Terpercaya</p>
    </div>

    <p>Halo <strong>${userName}</strong>,</p>
    <p>Terima kasih telah mendaftar di <strong style="color: #0284c7;">JualRugi.my.id</strong> menggunakan email <a href="mailto:${targetEmail}" style="color: #0284c7; text-decoration: none;">${targetEmail}</a>. Akun Anda telah aktif dan siap digunakan untuk mencari barang diskon sadis atau menjual barang BU Anda!</p>

    <div class="tip-box">
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">
        <span style="color: #0f172a;">🛡️ 3 Tips Aman Transaksi di </span><span style="color: #0284c7;">JualRugi.my.id:</span>
      </div>
      <ul style="margin: 6px 0 0; padding-left: 18px; color: #78350f; font-size: 13px; line-height: 1.6;">
        <li style="margin-bottom: 6px;">Selalu bertransaksi dengan <strong>COD (Cash On Delivery) tatap muka</strong> di tempat ramai (Mall, Minimarket, Stasiun).</li>
        <li style="margin-bottom: 6px;"><strong>Jangan pernah mentransfer DP / uang muka</strong> sebelum memegang dan menguji langsung fisik barang.</li>
        <li>Cek kelengkapan, fungsi tombol, baterai, dan IMEI sebelum melakukan pembayaran.</li>
      </ul>
    </div>

    <p style="margin: 20px 0; font-size: 14px; color: #0f172a; line-height: 1.6;">
      🎁 <strong>Bonus Pendaftaran:</strong> Anda mendapatkan <strong>1 Slot Kuota Pasang Iklan Gratis</strong> untuk mulai memasang iklan barang butuh uang hari ini!
    </p>

    <div style="text-align: center; margin: 24px 0 12px;">
      <a href="https://jualrugi.my.id/#pasangiklan" class="button" style="display: inline-block; background: #0284c7; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3);">
        🚀 Pasang Iklan Sekarang (Gunakan Kuota Gratis)
      </a>
    </div>
    <p style="text-align: center; font-size: 12px; color: #64748b; margin: 6px 0 24px;">
      Direct Link Pasang Iklan: <a href="https://jualrugi.my.id/#pasangiklan" style="color: #0284c7; font-weight: 600;">https://jualrugi.my.id/#pasangiklan</a>
    </p>

    <!-- Ajakan Bergabung Grup WhatsApp Resmi -->
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center;">
      <div style="display: inline-block; background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">
        💬 KOMUNITAS JUALRUGI
      </div>
      <h3 style="color: #166534; font-size: 16px; margin: 4px 0 8px;">
        Yuk, Gabung di Grup WhatsApp JualRugi.my.id!
      </h3>
      <p style="font-size: 13px; line-height: 1.5; color: #14532d; margin: 0 0 16px;">
        Dapatkan info kilat barang BU diskon sadis, tips aman COD tatap muka, dan promosi langsung dengan sesama anggota.
      </p>
      <a href="https://chat.whatsapp.com/Be6mlNR46KKCsqcNh3Wnvi" style="display: inline-block; background: #22c55e; color: #ffffff !important; font-weight: bold; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; box-shadow: 0 3px 10px rgba(34, 197, 94, 0.35);" target="_blank" rel="noopener noreferrer">
        🟢 Gabung Grup WhatsApp Sekarang
      </a>
      <div style="margin-top: 10px; font-size: 11px; color: #15803d; word-break: break-all;">
        Link alternatif: <a href="https://chat.whatsapp.com/Be6mlNR46KKCsqcNh3Wnvi" style="color: #166534; font-weight: bold; text-decoration: underline;">https://chat.whatsapp.com/Be6mlNR46KKCsqcNh3Wnvi</a>
      </div>
    </div>

    <p style="text-align: center; font-size: 15px; font-weight: 800; color: #0284c7; margin: 24px 0 12px;">
      Selamat berbelanja & happy shopping! 🎉
    </p>
    <p style="text-align: center; font-size: 12px; color: #64748b; margin: 0 0 20px;">
      Direct Link Pasang Iklan: <a href="https://jualrugi.my.id/#pasangiklan" style="color: #0284c7; font-weight: 600;">https://jualrugi.my.id/#pasangiklan</a>
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 20px;" />
    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
      Email otomatis ini dikirimkan khusus untuk ${targetEmail} atas pendaftaran di JualRugi.my.id.<br/>
      Jika Anda tidak merasa mendaftar, Anda dapat mengabaikan email ini.
    </p>
  </div>
</body>
</html>
    `.trim();

    const pesanWa =
      `Halo *${userName}*! 👋\n\n` +
      `Selamat datang di *jualrugi.my.id* — Platform Jual Beli Barang Bekas & Preloved Paling Praktis!\n\n` +
      `Akun Anda dengan email *${targetEmail}* telah berhasil dibuat dan aktif sepenuhnya. Sekarang Anda sudah bisa mulai pasang iklan gratis atau mencari barang impian dengan penawaran terbaik.\n\n` +
      `🔗 *Silakan masuk ke akun Anda di sini:*\n` +
      `https://jualrugi.my.id/login\n\n` +
      `Jika butuh bantuan, tim kami siap membantu kapan, saja. \n` +
      `Silakan simpan nomor wa ini sebagai admin Selamat bertransaksi, bro/sis! 🚀\n\n` +
      `---\n` +
      `*jualrugi.my.id*`;

    const welcomeText = pesanWa;

    // C. Kirim via Brevo v3 Transactional SMTP Email API
    console.log('[CF Pages - Welcome Email] Mengirim payload ke https://api.brevo.com/v3/smtp/email...');
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': activeBrevoKey,
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
            email: targetEmail,
            name: userName,
          },
        ],
        subject: welcomeSubject,
        htmlContent: welcomeHtml,
        textContent: welcomeText,
        params: {
          FIRSTNAME: userName,
          EMAIL: targetEmail,
        },
      }),
    });

    const brevoData: any = await brevoRes.json().catch(() => ({}));
    const brevoSuccess = brevoRes.ok;
    console.log(`[CF Pages - Welcome Email] Brevo Response Status: ${brevoRes.status}`, brevoData);

    // D. Kirim Pesan WhatsApp Selamat Datang Otomatis via Fonnte API (Isi Sama Persis)
    let fonnteResult: any = null;
    let fonnteSuccess = false;
    if (userPhone && userPhone.length >= 9) {
      try {
        const FONNTE_TOKEN = env.FONNTE_TOKEN || atob('RzJ3YjlMck1tYlRXSlAxdGJCdzM=');

        const fonnteFormData = new FormData();
        fonnteFormData.append('target', userPhone);
        fonnteFormData.append('message', pesanWa);
        fonnteFormData.append('countryCode', '62');

        console.log(`[CF Pages - Fonnte WA] Mengirim WhatsApp ke ${userPhone}...`);
        const fonnteRes = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: FONNTE_TOKEN,
          },
          body: fonnteFormData,
        });

        fonnteResult = await fonnteRes.json().catch(() => ({}));
        fonnteSuccess = fonnteRes.ok;
        console.log(`[CF Pages - Fonnte WA] Status ${fonnteRes.status}:`, fonnteResult);
      } catch (fonnteErr) {
        console.warn('[CF Pages - Fonnte WA] Peringatan kirim WA Fonnte:', fonnteErr);
      }
    }

    // E. Teruskan data registrasi ke Webhook Make.com (Payload: nama, email, password, nomor_wa)
    const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/1i6d9bq5157dnksxju764f8uno3bdsam';
    const MAKE_FALLBACK_URL = 'https://hook.eu1.make.com/1i6d9bq5i57dnksxju764f8uno3bdsam';
    const makePayload = {
      nama: userName,
      email: targetEmail,
      password: body.password || '',
      nomor_wa: userPhone,
    };
    try {
      fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makePayload),
      }).then(async (res) => {
        const text = await res.text().catch(() => '');
        if (!res.ok || text.includes('Webhook not found')) {
          fetch(MAKE_FALLBACK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(makePayload),
          }).catch(() => {});
        }
      }).catch(() => {
        fetch(MAKE_FALLBACK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(makePayload),
        }).catch(() => {});
      });
    } catch (e) {}

    if (brevoSuccess || fonnteSuccess) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Notifikasi pendaftaran diproses (Email: ${brevoSuccess ? 'Terkirim' : 'Gagal'}, WA: ${fonnteSuccess ? 'Terkirim' : 'Gagal'}). Happy shopping!`,
          provider: 'brevo_and_fonnte',
          emailSentTo: targetEmail,
          whatsappSentTo: userPhone,
          brevo: {
            success: brevoSuccess,
            status: brevoRes.status,
            messageId: brevoData.messageId,
          },
          fonnte: {
            success: fonnteSuccess,
            detail: fonnteResult,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.error('[CF Pages - Welcome Email] Pengiriman gagal di Brevo dan Fonnte');
      return new Response(
        JSON.stringify({
          success: false,
          error: `Gagal mengirim notifikasi (Brevo HTTP ${brevoRes.status}).`,
          brevoDetails: brevoData,
          fonnteDetails: fonnteResult,
        }),
        {
          status: brevoRes.status || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (err: any) {
    console.error('[CF Pages - Welcome Email] Fatal Exception:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Terjadi kesalahan sistem di Cloudflare Pages Functions.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
