interface Env {
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  console.log('[CF Pages - Ad Published Email] Menerima request POST /api/send-ad-published-email');

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('[CF Pages - Ad Published Email] Gagal parsing request JSON body:', parseErr);
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

    const {
      listingId,
      listingTitle,
      recipientEmail,
      recipientName,
      subject,
    } = body;

    const targetEmail = (recipientEmail || 'bca.ccpl@gmail.com').trim();
    const targetTitle = (listingTitle || 'Produk Butuh Uang JualRugi').trim();
    const emailSubject = subject || 'Iklan Tayang';
    const cleanListingId = (listingId || 'bu-demo').trim();
    const directAdLink = `https://jualrugi.my.id/?id=${encodeURIComponent(cleanListingId)}`;

    if (!targetEmail || !targetEmail.includes('@')) {
      console.warn('[CF Pages - Ad Published Email] Email penerima tidak valid:', targetEmail);
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

    // Ambil API Key dari Cloudflare Pages Environment Variables
    const activeBrevoKey =
      (env.BREVO_API_KEY && env.BREVO_API_KEY.trim() && !env.BREVO_API_KEY.includes('your_')
        ? env.BREVO_API_KEY.trim()
        : null);

    const senderEmail = env.BREVO_SENDER_EMAIL || 'admin@jualrugi.my.id';
    const senderName = env.BREVO_SENDER_NAME || 'JualRugi.my.id';

    console.log(`[CF Pages - Ad Published Email] Mengirim ke: ${targetEmail} | Iklan: "${targetTitle}" (ID: ${cleanListingId})`);
    console.log(`[CF Pages - Ad Published Email] Status Brevo API Key: ${activeBrevoKey ? 'TERSEDIA (format: ' + activeBrevoKey.slice(0, 12) + '...)' : 'TIDAK DITEMUKAN / KOSONG'}`);
    console.log(`[CF Pages - Ad Published Email] Link Iklan: ${directAdLink}`);

    if (!activeBrevoKey) {
      console.error('[CF Pages - Ad Published Email] CRITICAL: BREVO_API_KEY belum disetting di dashboard Cloudflare Pages!');
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
      console.error('[CF Pages - Ad Published Email] CRITICAL: Format BREVO_API_KEY salah. Harus berawalan "xkeysib-"!');
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

    // Template Email Iklan Tayang Resmi JualRugi
    const textContent = `Selamat, iklan Anda telah tayang!\n\nJudul: "${targetTitle}"\nSilakan cek iklan Anda melalui link berikut: ${directAdLink}\n\nPlatform: JualRugi.my.id`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${emailSubject} - JualRugi.my.id</title>
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
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Moderasi Selesai • Resmi Tayang</span>
      <h2>Selamat, iklan Anda telah tayang! 🎉</h2>
      <p style="font-weight: 600; color: #0f172a; margin-top: 4px;">"${targetTitle}"</p>
    </div>

    <p>Selamat, iklan Anda telah selesai dimoderasi dan telah resmi tayang di platform <strong>JualRugi.my.id</strong>.</p>
    
    <p>Calon pembeli dapat langsung menemukan produk Anda dan menghubungi Anda via Chat COD tatap muka yang aman.</p>

    <div class="cta-container">
      <a href="${directAdLink}" class="btn-cta" target="_blank" rel="noopener noreferrer">
        👀 Cek Iklan Anda Sekarang
      </a>
      <div class="link-box">
        Silakan cek iklan Anda melalui link berikut:<br />
        <a href="${directAdLink}" style="color: #0284c7; font-weight: bold; word-break: break-all;">${directAdLink}</a>
      </div>
    </div>

    <div class="footer">
      Email otomatis ini dikirimkan oleh <strong>JualRugi.my.id</strong> sebagai notifikasi resmi status penayangan iklan.<br/>
      Subject: <strong>${emailSubject}</strong> • Penerima: <strong>${targetEmail}</strong>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Kirim via Brevo v3 Transactional SMTP Email API
    console.log('[CF Pages - Ad Published Email] Mengirim payload ke https://api.brevo.com/v3/smtp/email...');
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
            name: recipientName || 'Pengiklan JualRugi',
          },
        ],
        subject: emailSubject,
        htmlContent,
        textContent,
      }),
    });

    const brevoData = await brevoRes.json().catch(() => ({}));
    console.log(`[CF Pages - Ad Published Email] Brevo Response Status: ${brevoRes.status}`, brevoData);

    if (brevoRes.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Email notifikasi "${emailSubject}" berhasil dikirim via Brevo ke ${targetEmail}!`,
          sentTo: targetEmail,
          listingId: cleanListingId,
          adLink: directAdLink,
          subject: emailSubject,
          provider: 'brevo_cloudflare_pages',
          messageId: brevoData.messageId,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.error('[CF Pages - Ad Published Email] Brevo API merespons error:', brevoRes.status, brevoData);
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
    console.error('[CF Pages - Ad Published Email] Fatal Exception:', err);
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
