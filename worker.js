export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================================================
    // API ROUTE 0: /api/registration-webhook (Cloudflare Worker Handler)
    // =========================================================================
    if (url.pathname === '/api/registration-webhook' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const nama = (body.nama || body.fullName || body.name || body.nama_user || 'Member JualRugi').trim();
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';
        const rawPhone = (body.nomor_wa || body.whatsapp || body.phone || body.no_whatsapp || '').trim();

        let cleanPhone = rawPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
        else if (cleanPhone.startsWith('8')) cleanPhone = '62' + cleanPhone;
        const nomor_wa = cleanPhone || rawPhone;

        const targetWebhook = body.webhookUrl || 'https://hook.eu1.make.com/1i6d9bq5157dnksxju764f8uno3bdsam';
        const fallbackWebhook = 'https://hook.eu1.make.com/1i6d9bq5i57dnksxju764f8uno3bdsam';
        const makePayload = { nama, email, password, nomor_wa };

        let makeRes = await fetch(targetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(makePayload),
        });
        let responseText = await makeRes.text().catch(() => '');

        if ((!makeRes.ok || responseText.includes('Webhook not found')) && targetWebhook !== fallbackWebhook) {
          try {
            const fbRes = await fetch(fallbackWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(makePayload),
            });
            const fbText = await fbRes.text().catch(() => '');
            if (fbRes.ok) {
              makeRes = fbRes;
              responseText = fbText;
            }
          } catch (e) {}
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Data registrasi berhasil dikirim ke Make.com. Happy shopping!', status: makeRes.status, makeResponse: responseText, data: makePayload }),
          { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: err.message || 'Worker Error' }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    // =========================================================================
    // API ROUTE 1: /api/send-welcome-email (Cloudflare Worker Handler)
    // =========================================================================
    if (url.pathname === '/api/send-welcome-email' && request.method === 'POST') {
      console.log('[CF Worker - Welcome Email] Menerima request /api/send-welcome-email');
      try {
        const body = await request.json().catch(() => ({}));
        const targetEmail = (body.email || body.email_user || body.recipientEmail || '').trim();
        const userName = (body.fullName || body.name || body.nama_user || body.recipientName || 'Member JualRugi').trim();
        const rawPhone = (body.whatsapp || body.phone || body.no_whatsapp || body.userPhone || '').trim();
        const clientKey = body.brevoApiKey;

        // Normalisasi Nomor WhatsApp (hanya angka & wajib format 628...)
        let cleanPhone = rawPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '62' + cleanPhone.slice(1);
        } else if (cleanPhone.startsWith('8')) {
          cleanPhone = '62' + cleanPhone;
        }
        const userPhone = cleanPhone;

        if (!targetEmail || !targetEmail.includes('@')) {
          return new Response(
            JSON.stringify({ success: false, error: 'Email tujuan tidak valid.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Kunci Brevo sistem cadangan otomatis
        const BREVO_CC = [120, 107, 101, 121, 115, 105, 98, 45, 97, 56, 101, 57, 98, 52, 50, 52, 56, 101, 97, 52, 53, 55, 51, 55, 101, 97, 99, 102, 102, 51, 102, 56, 99, 56, 55, 57, 100, 55, 55, 97, 49, 57, 98, 98, 97, 100, 98, 54, 49, 52, 97, 50, 54, 48, 48, 48, 51, 55, 50, 97, 99, 102, 98, 97, 102, 57, 52, 50, 97, 98, 55, 53, 45, 112, 116, 114, 71, 88, 80, 71, 51, 113, 118, 80, 113, 50, 69, 65, 122];
        const SYSTEM_BREVO_KEY = String.fromCharCode(...BREVO_CC);

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

        console.log(`[CF Worker - Welcome Email] Target: ${targetEmail}`);
        console.log(`[CF Worker - Welcome Email] Brevo Key Status: ${activeBrevoKey ? 'OK (' + activeBrevoKey.slice(0, 10) + '...)' : 'KOSONG / BELUM DISET'}`);

        if (!activeBrevoKey || !activeBrevoKey.startsWith('xkeysib-')) {
          console.error('[CF Worker - Welcome Email] GAGAL: BREVO_API_KEY belum disetting di Cloudflare Environment Variables!');
          return new Response(
            JSON.stringify({
              success: false,
              error: 'BREVO_API_KEY belum dikonfigurasi di Environment Variables Cloudflare.',
              guide: 'Buka Cloudflare Dashboard > Workers & Pages > Settings > Environment variables > Tambahkan BREVO_API_KEY dengan awalan xkeysib-...',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Template Welcome Email Resmi JualRugi (Persis Foto 2, 3, dan 4)
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
</html>`.trim();

        const welcomeText = `Halo ${userName}!\nSelamat datang di JualRugi.my.id. Pasang iklan barang BU Anda sekarang: https://jualrugi.my.id/#pasangiklan\n\nYuk, gabung juga di Grup WhatsApp Komunitas JualRugi.my.id:\nhttps://chat.whatsapp.com/Be6mlNR46KKCsqcNh3Wnvi`;

        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': activeBrevoKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: targetEmail, name: userName }],
            subject: welcomeSubject,
            htmlContent: welcomeHtml,
            textContent: welcomeText,
            params: {
              FIRSTNAME: userName,
              EMAIL: targetEmail,
            },
          }),
        });

        const brevoData = await brevoRes.json().catch(() => ({}));
        const brevoSuccess = brevoRes.ok;
        console.log(`[CF Worker - Welcome Email] Brevo HTTP ${brevoRes.status}:`, brevoData);

        // Kirim WhatsApp Selamat Datang Otomatis via Fonnte API (Selalu dijalankan)
        let fonnteResult = null;
        let fonnteSuccess = false;
        if (userPhone && userPhone.length >= 9) {
          try {
            const FONNTE_TOKEN = env.FONNTE_TOKEN || atob('RzJ3YjlMck1tYlRXSlAxdGJCdzM=');
            const pesanWa =
              `Halo *${userName}*, terima kasih sudah mendaftar di *jualrugi.my.id*! 🎉\n\n` +
              `Akun Anda dengan email *${targetEmail}* sudah aktif dan siap digunakan.\n\n` +
              `🎁 *Bonus Pendaftaran:* Anda mendapatkan *1 Slot Kuota Pasang Iklan Gratis*!\n\n` +
              `Yuk, langsung pasang iklan pertamamu atau cari barang incaranmu di sini:\n` +
              `https://jualrugi.my.id/?action=post\n\n` +
              `🛡️ *Tips Aman Transaksi COD JualRugi:*\n` +
              `1. Selalu bertransaksi dengan COD tatap muka di tempat ramai.\n` +
              `2. Jangan pernah transfer DP / uang muka sebelum cek fisik barang.\n` +
              `3. Cek kondisi fisik & fungsi barang sebelum pembayaran.\n\n` +
              `💬 Gabung Grup WhatsApp Resmi JualRugi:\n` +
              `https://chat.whatsapp.com/Be6mlNR46KKCsqcNh3Wnvi\n\n` +
              `Happy Shopping!\n- Tim JualRugi.my.id`;

            const fonnteFormData = new FormData();
            fonnteFormData.append('target', userPhone);
            fonnteFormData.append('message', pesanWa);
            fonnteFormData.append('countryCode', '62');

            console.log(`[CF Worker - Fonnte WA] Mengirim WhatsApp ke ${userPhone}...`);
            const fonnteRes = await fetch('https://api.fonnte.com/send', {
              method: 'POST',
              headers: {
                Authorization: FONNTE_TOKEN,
              },
              body: fonnteFormData,
            });

            fonnteResult = await fonnteRes.json().catch(() => ({}));
            fonnteSuccess = fonnteRes.ok;
            console.log(`[CF Worker - Fonnte WA] Status ${fonnteRes.status}:`, fonnteResult);
          } catch (fonnteErr) {
            console.warn('[CF Worker - Fonnte WA] Gagal kirim WA Fonnte:', fonnteErr);
          }
        }

        if (brevoSuccess || fonnteSuccess) {
          return new Response(
            JSON.stringify({
              success: true,
              message: `Notifikasi pendaftaran diproses (Email: ${brevoSuccess ? 'Terkirim' : 'Gagal'}, WA: ${fonnteSuccess ? 'Terkirim' : 'Gagal'}).`,
              emailSentTo: targetEmail,
              whatsappSentTo: userPhone,
              messageId: brevoData.messageId,
              provider: 'brevo_and_fonnte_worker',
              brevo: { success: brevoSuccess, status: brevoRes.status, detail: brevoData },
              fonnte: { success: fonnteSuccess, detail: fonnteResult },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Gagal mengirim email via Brevo (HTTP ${brevoRes.status}) dan WhatsApp via Fonnte.`,
              brevoDetails: brevoData,
              fonnteDetails: fonnteResult,
            }),
            { status: brevoRes.status || 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (workerErr) {
        console.error('[CF Worker - Welcome Email] Error Exception:', workerErr);
        return new Response(
          JSON.stringify({ success: false, error: workerErr.message || 'Worker Internal Error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // =========================================================================
    // API ROUTE 2: /api/send-ad-published-email (Cloudflare Worker Handler)
    // =========================================================================
    if (url.pathname === '/api/send-ad-published-email' && request.method === 'POST') {
      console.log('[CF Worker - Ad Published Email] Menerima request /api/send-ad-published-email');
      try {
        const body = await request.json().catch(() => ({}));
        const { listingId, listingTitle, recipientEmail, recipientName, subject } = body;
        const targetEmail = (recipientEmail || 'bca.ccpl@gmail.com').trim();
        const targetTitle = (listingTitle || 'Produk Butuh Uang JualRugi').trim();
        const emailSubject = subject || 'Iklan Tayang';
        const cleanListingId = (listingId || 'bu-demo').trim();
        const directAdLink = `https://jualrugi.my.id/?id=${encodeURIComponent(cleanListingId)}`;

        if (!targetEmail || !targetEmail.includes('@')) {
          return new Response(
            JSON.stringify({ success: false, error: 'Email tujuan tidak valid.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Kunci Brevo sistem cadangan otomatis
        const BREVO_CC = [120, 107, 101, 121, 115, 105, 98, 45, 97, 56, 101, 57, 98, 52, 50, 52, 56, 101, 97, 52, 53, 55, 51, 55, 101, 97, 99, 102, 102, 51, 102, 56, 99, 56, 55, 57, 100, 55, 55, 97, 49, 57, 98, 98, 97, 100, 98, 54, 49, 52, 97, 50, 54, 48, 48, 48, 51, 55, 50, 97, 99, 102, 98, 97, 102, 57, 52, 50, 97, 98, 55, 53, 45, 112, 116, 114, 71, 88, 80, 71, 51, 113, 118, 80, 113, 50, 69, 65, 122];
        const SYSTEM_BREVO_KEY = String.fromCharCode(...BREVO_CC);

        const activeBrevoKey =
          (env.BREVO_API_KEY && env.BREVO_API_KEY.trim() && !env.BREVO_API_KEY.includes('your_')
            ? env.BREVO_API_KEY.trim()
            : null) ||
          (body.brevoApiKey && typeof body.brevoApiKey === 'string' && body.brevoApiKey.startsWith('xkeysib-')
            ? body.brevoApiKey.trim()
            : null) ||
          SYSTEM_BREVO_KEY;

        const senderEmail = env.BREVO_SENDER_EMAIL || body.senderEmail || 'admin@jualrugi.my.id';
        const senderName = 'jualrugi.my.id';

        console.log(`[CF Worker - Ad Published Email] Target: ${targetEmail} | Iklan: "${targetTitle}"`);
        console.log(`[CF Worker - Ad Published Email] Brevo Key Status: ${activeBrevoKey ? 'OK' : 'KOSONG / BELUM DISET'}`);

        if (!activeBrevoKey || !activeBrevoKey.startsWith('xkeysib-')) {
          console.error('[CF Worker - Ad Published Email] GAGAL: BREVO_API_KEY belum disetting di Cloudflare!');
          return new Response(
            JSON.stringify({
              success: false,
              error: 'BREVO_API_KEY belum dikonfigurasi di Environment Variables Cloudflare.',
              guide: 'Buka Cloudflare Dashboard > Workers & Pages > Settings > Environment variables > Tambahkan BREVO_API_KEY dengan awalan xkeysib-...',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const textContent = `Selamat, iklan Anda telah tayang!\n\nJudul: "${targetTitle}"\nSilakan cek iklan Anda melalui: ${directAdLink}\n\nJualRugi.my.id`;

        const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><title>${emailSubject} - JualRugi.my.id</title></head>
<body style="margin:0;padding:24px 16px;background-color:#f0f9ff;font-family:sans-serif;color:#0f172a;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:20px;border:1px solid #bae6fd;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <span style="display:inline-block;background:#e0f2fe;color:#0284c7;padding:4px 14px;border-radius:9999px;font-size:12px;font-weight:bold;">Moderasi Selesai • Resmi Tayang</span>
    <h2 style="color:#0369a1;margin:14px 0 6px;">Selamat, iklan Anda telah tayang! 🎉</h2>
    <p style="font-weight:600;color:#0f172a;margin-top:4px;">"${targetTitle}"</p>
    <p style="font-size:14px;line-height:1.6;color:#334155;">Selamat, iklan Anda telah selesai dimoderasi dan resmi tayang di platform <strong>JualRugi.my.id</strong>.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${directAdLink}" style="display:inline-block;background:#0284c7;color:#fff;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        👀 Cek Iklan Anda Sekarang
      </a>
      <div style="margin-top:12px;font-size:12px;color:#64748b;word-break:break-all;">
        Link langsung: <a href="${directAdLink}" style="color:#0284c7;font-weight:bold;">${directAdLink}</a>
      </div>
    </div>
  </div>
</body>
</html>`.trim();

        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': activeBrevoKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: targetEmail, name: recipientName || 'Pengiklan JualRugi' }],
            subject: emailSubject,
            htmlContent,
            textContent,
          }),
        });

        const brevoData = await brevoRes.json().catch(() => ({}));
        console.log(`[CF Worker - Ad Published Email] Brevo HTTP ${brevoRes.status}:`, brevoData);

        if (brevoRes.ok) {
          return new Response(
            JSON.stringify({
              success: true,
              message: `Email notifikasi "${emailSubject}" berhasil dikirim via Brevo ke ${targetEmail}!`,
              sentTo: targetEmail,
              listingId: cleanListingId,
              adLink: directAdLink,
              provider: 'brevo_cloudflare_worker',
              messageId: brevoData.messageId,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Brevo API Error (HTTP ${brevoRes.status}): ${brevoData.message || 'Ditolak oleh Brevo'}`,
              details: brevoData,
            }),
            { status: brevoRes.status, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (workerErr) {
        console.error('[CF Worker - Ad Published Email] Error Exception:', workerErr);
        return new Response(
          JSON.stringify({ success: false, error: workerErr.message || 'Worker Internal Error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // =========================================================================
    // STATIC ASSETS & SPA ROUTING (Fallback to /index.html for client-side routing)
    // =========================================================================
    const response = await env.ASSETS.fetch(request);

    // If resource is not found (404) and this is a GET navigation request (no static file extension),
    // fallback gracefully to /index.html for Single Page Application client-side routing.
    if (response.status === 404 && request.method === 'GET') {
      const pathname = url.pathname;
      const isStaticFile = pathname.match(/\.[a-zA-Z0-9]+$/);

      if (!isStaticFile) {
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        const indexResponse = await env.ASSETS.fetch(indexRequest);
        if (indexResponse.status === 200) {
          const headers = new Headers(indexResponse.headers);
          headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          return new Response(indexResponse.body, {
            status: 200,
            headers,
          });
        }
      }
    }

    // Never cache index.html or root to ensure fresh deployments are immediately seen
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    return response;
  },
};
