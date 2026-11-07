interface Env {
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
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

    const { name, email, phone, userId, city, brevoApiKey: clientKey } = body;
    const targetEmail = (email || '').trim();
    const userName = (name || 'Pengguna JualRugi').trim();
    const userPhone = (phone || '').trim();

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

    // Ambil API Key dari Cloudflare Pages Environment Variables, atau fallback ke body
    const activeBrevoKey =
      (env.BREVO_API_KEY && env.BREVO_API_KEY.trim() && !env.BREVO_API_KEY.includes('your_')
        ? env.BREVO_API_KEY.trim()
        : null) ||
      (clientKey && typeof clientKey === 'string' && clientKey.startsWith('xkeysib-')
        ? clientKey.trim()
        : null);

    const senderEmail = env.BREVO_SENDER_EMAIL || 'admin@jualrugi.my.id';
    const senderName = env.BREVO_SENDER_NAME || 'JualRugi.my.id';

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

    if (!activeBrevoKey.startsWith('xkeysib-')) {
      console.error('[CF Pages - Welcome Email] CRITICAL: Format BREVO_API_KEY salah. Harus berawalan "xkeysib-"!');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Format BREVO_API_KEY tidak valid. API Key resmi Brevo v3 wajib diawali dengan "xkeysib-".',
          debugInfo: {
            currentKeyPrefix: activeBrevoKey.slice(0, 8),
            hint: 'Pastikan bukan memasukkan "brevo-code" (kode TXT verifikasi domain), melainkan API Key dari menu Brevo: Settings > SMTP & API > API Keys.',
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
            CITY: city || undefined,
          },
          updateEnabled: true,
        }),
      });
      const contactData = await contactRes.json().catch(() => ({}));
      console.log('[CF Pages - Welcome Email] Sync Contact Brevo Status:', contactRes.status, contactData);
    } catch (contactErr) {
      console.warn('[CF Pages - Welcome Email] Peringatan sinkronisasi kontak Brevo:', contactErr);
    }

    // B. Template Welcome Email Resmi JualRugi
    const welcomeSubject = '🎉 Selamat Datang di JualRugi.my.id! Dapatkan Kuota Pasang Iklan Gratis';
    const welcomeHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Selamat Datang di JualRugi.my.id</title>
</head>
<body style="margin:0;padding:24px 16px;background-color:#f0f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;border:1px solid #bae6fd;padding:32px 24px;box-shadow:0 10px 25px -5px rgba(2,132,199,0.1);">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#0284c7;font-size:24px;margin:0 0 6px;">JualRugi<span style="color:#0f172a;">.my.id</span></h1>
      <span style="display:inline-block;background:#e0f2fe;color:#0284c7;padding:6px 16px;border-radius:9999px;font-size:12px;font-weight:bold;text-transform:uppercase;">
        Pendaftaran Berhasil • 100% COD Aman
      </span>
    </div>

    <h2 style="color:#0369a1;font-size:20px;margin:16px 0 10px;">Halo, ${userName}! 👋</h2>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:10px 0;">
      Selamat bergabung di platform <strong>JualRugi.my.id</strong> — bursa jual-beli barang bekas butuh uang (BU) cepat dengan sistem COD tatap muka paling aman tanpa risiko transfer DP!
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:16px;margin:20px 0;">
      <h3 style="color:#166534;font-size:15px;margin:0 0 6px;">🎁 Bonus Pendaftaran Akun Baru</h3>
      <p style="font-size:13px;line-height:1.5;color:#14532d;margin:0;">
        Akun Anda mendapatkan <strong>1 Kuota Pasang Iklan Gratis</strong> untuk mulai memasang iklan barang BU hari ini!
      </p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="https://jualrugi.my.id/#pasangiklan" style="display:inline-block;background:#0284c7;color:#ffffff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;box-shadow:0 4px 14px rgba(2,132,199,0.35);" target="_blank" rel="noopener noreferrer">
        🚀 Pasang Iklan Sekarang
      </a>
      <div style="margin-top:14px;font-size:12px;color:#64748b;word-break:break-all;">
        Direct Link Pasang Iklan: <br/>
        <a href="https://jualrugi.my.id/#pasangiklan" style="color:#0284c7;font-weight:bold;">https://jualrugi.my.id/#pasangiklan</a>
      </div>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:32px;font-size:12px;color:#94a3b8;text-align:center;line-height:1.5;">
      Email otomatis ini dikirimkan khusus untuk <strong>${targetEmail}</strong> atas pendaftaran di JualRugi.my.id.<br/>
      Jangan pernah mentransfer DP kepada siapapun sebelum bertemu langsung (COD).
    </div>
  </div>
</body>
</html>
    `.trim();

    const welcomeText = `Halo ${userName}!\n\nSelamat datang di JualRugi.my.id.\nAkun Anda mendapatkan bonus 1 Kuota Pasang Iklan Gratis.\nPasang iklan barang BU Anda sekarang melalui: https://jualrugi.my.id/#pasangiklan\n\nIngat selalu: Wajib transaksi COD tatap muka di tempat ramai tanpa transfer DP!`;

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
      }),
    });

    const brevoData = await brevoRes.json().catch(() => ({}));
    console.log(`[CF Pages - Welcome Email] Brevo Response Status: ${brevoRes.status}`, brevoData);

    if (brevoRes.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Welcome email berhasil dikirim via Brevo API ke ${targetEmail}!`,
          provider: 'brevo_cloudflare_pages',
          emailSentTo: targetEmail,
          brevoMessageId: brevoData.messageId,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.error('[CF Pages - Welcome Email] Brevo API merespons error:', brevoRes.status, brevoData);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Gagal mengirim email via Brevo (Status ${brevoRes.status}): ${brevoData.message || 'Terjadi penolakan dari API Brevo.'}`,
          details: brevoData,
        }),
        {
          status: brevoRes.status,
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
