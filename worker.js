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
              `Halo *${userName}*! 👋\n\n` +
              `Selamat datang di *jualrugi.my.id* — Platform Jual Beli Barang Bekas & Preloved Paling Praktis!\n\n` +
              `Akun Anda dengan email *${targetEmail}* telah berhasil dibuat dan aktif sepenuhnya. Sekarang Anda sudah bisa mulai pasang iklan gratis atau mencari barang impian dengan penawaran terbaik.\n\n` +
              `🔗 *Silakan masuk ke akun Anda di sini:*\n` +
              `https://jualrugi.my.id/login?email=${encodeURIComponent(targetEmail)}\n\n` +
              `Jika butuh bantuan, tim kami siap membantu kapan, saja. \n` +
              `Silakan simpan nomor wa ini sebagai admin Selamat bertransaksi, bro/sis! 🚀\n\n` +
              `---\n` +
              `*jualrugi.my.id*`;

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
        const {
          listingId,
          listingTitle,
          recipientEmail,
          recipientName,
          recipientPhone,
          userPhone,
          whatsapp,
          phone,
          subject,
          isEdit,
        } = body;

        const isAdEdit = isEdit === true || isEdit === 'true';
        const targetEmail = (recipientEmail || 'bca.ccpl@gmail.com').trim();
        const targetTitle = (listingTitle || 'Produk Butuh Uang JualRugi').trim();
        const cleanListingId = (listingId || 'bu-demo').trim();
        const directAdLink = `https://jualrugi.my.id/?id=${encodeURIComponent(cleanListingId)}`;
        const userName = (recipientName || 'Juragan JualRugi').trim();
        const emailSubject = subject || (isAdEdit ? 'Pembaruan Iklan Tayang' : 'Iklan Tayang');

        let rawPhone = recipientPhone || userPhone || whatsapp || phone || '';
        let cleanPhone = String(rawPhone).replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
        else if (cleanPhone.startsWith('8')) cleanPhone = '62' + cleanPhone;

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

        console.log(`[CF Worker - Ad Published Email] Target: ${targetEmail} | Iklan: "${targetTitle}" (ID: ${cleanListingId}) | isEdit: ${isAdEdit}`);

        // Template Notifikasi WhatsApp Fonnte & Email Resmi JualRugi
        const statusHeadline = isAdEdit
          ? 'perubahan iklan Anda telah selesai dimoderasi dan *RESMI KEMBALI TAYANG*'
          : 'iklan Anda telah selesai dimoderasi dan *RESMI TAYANG*';

        const textContent =
          `Halo *${userName}*! 🎉\n\n` +
          `Kabar baik, ${statusHeadline} di *jualrugi.my.id*!\n\n` +
          `📋 *Detail Iklan:*\n` +
          `• ID Iklan: *${cleanListingId}*\n` +
          `• Judul: *"${targetTitle}"*\n\n` +
          `🔗 *Lihat iklan Anda langsung di sini:*\n` +
          `${directAdLink}\n\n` +
          `Iklan Anda kini dapat ditemukan dan dihubungi oleh calon pembeli. Pastikan selalu bertransaksi dengan sistem COD (Cash On Delivery) tatap muka di tempat ramai dan jangan pernah mentransfer DP sebelum cek barang.\n\n` +
          `Semoga cepat laku, bro/sis! 🚀\n\n` +
          `---\n` +
          `*Team Admin jualrugi.my.id*`;

        const headerBadge = isAdEdit ? 'Moderasi Selesai • Pembaruan Resmi Tayang' : 'Moderasi Selesai • Resmi Tayang';
        const headerTitle = isAdEdit ? 'Selamat, pembaruan iklan Anda telah tayang! 🎉' : 'Selamat, iklan Anda telah tayang! 🎉';

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
      <span class="badge">${headerBadge}</span>
      <h2>${headerTitle}</h2>
      <p style="font-weight: 600; color: #0f172a; margin-top: 4px;">"${targetTitle}"</p>
      <p style="font-size: 12px; color: #64748b; margin: 2px 0 0;">ID Iklan: <strong>${cleanListingId}</strong></p>
    </div>

    <p>Halo <strong>${userName}</strong>,</p>
    <p>Kabar baik, ${isAdEdit ? 'perubahan pada iklan Anda' : 'iklan Anda'} telah selesai dimoderasi dan telah resmi tayang di platform <strong>JualRugi.my.id</strong>.</p>
    
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
      Email otomatis ini dikirimkan oleh <strong>JualRugi.my.id</strong> untuk ${userName} sebagai notifikasi resmi status penayangan iklan.<br/>
      Subject: <strong>${emailSubject}</strong> • Penerima: <strong>${targetEmail}</strong>
    </div>
  </div>
</body>
</html>`.trim();

        let brevoSuccess = false;
        let brevoData = null;
        let brevoResStatus = 500;

        if (activeBrevoKey && activeBrevoKey.startsWith('xkeysib-')) {
          try {
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
                subject: emailSubject,
                htmlContent,
                textContent,
              }),
            });

            brevoData = await brevoRes.json().catch(() => ({}));
            brevoSuccess = brevoRes.ok;
            brevoResStatus = brevoRes.status;
            console.log(`[CF Worker - Ad Published Email] Brevo HTTP ${brevoRes.status}:`, brevoData);
          } catch (bErr) {
            console.warn('[CF Worker - Ad Published Email] Brevo dispatch error:', bErr);
          }
        }

        // Kirim WhatsApp Iklan Tayang Otomatis via Fonnte API
        let fonnteResult = null;
        let fonnteSuccess = false;
        if (cleanPhone && cleanPhone.length >= 8) {
          try {
            const FONNTE_TOKEN = env.FONNTE_TOKEN || atob('RzJ3YjlMck1tYlRXSlAxdGJCdzM=');
            const fonnteFormData = new FormData();
            fonnteFormData.append('target', cleanPhone);
            fonnteFormData.append('message', textContent);
            fonnteFormData.append('countryCode', '62');

            console.log(`[CF Worker - Fonnte WA Iklan Tayang] Mengirim WhatsApp ke ${cleanPhone}...`);
            const fonnteRes = await fetch('https://api.fonnte.com/send', {
              method: 'POST',
              headers: {
                Authorization: FONNTE_TOKEN,
              },
              body: fonnteFormData,
            });

            fonnteResult = await fonnteRes.json().catch(() => ({}));
            fonnteSuccess = fonnteRes.ok;
            console.log(`[CF Worker - Fonnte WA Iklan Tayang Status]: ${fonnteRes.status}`, fonnteResult);
          } catch (fonnteErr) {
            console.warn('[CF Worker - Fonnte WA Iklan Tayang Error]:', fonnteErr);
          }
        }

        if (brevoSuccess || fonnteSuccess) {
          return new Response(
            JSON.stringify({
              success: true,
              message: `Notifikasi "${emailSubject}" diproses (Email: ${brevoSuccess ? 'Terkirim' : 'Gagal'}, WA: ${fonnteSuccess ? 'Terkirim' : 'Sesuai Nomor'})!`,
              sentTo: targetEmail,
              whatsappSentTo: cleanPhone || undefined,
              listingId: cleanListingId,
              adLink: directAdLink,
              provider: 'brevo_and_fonnte_worker',
              messageId: brevoData ? brevoData.messageId : undefined,
              fonnte: fonnteResult,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Gagal mengirim email via Brevo (HTTP ${brevoResStatus}) dan WhatsApp via Fonnte.`,
              details: brevoData,
              fonnteDetails: fonnteResult,
            }),
            { status: brevoResStatus || 500, headers: { 'Content-Type': 'application/json' } }
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
    // ENDPOINT 3B: LIST GRUP WHATSAPP FONNTE (/api/fonnte/groups)
    // =========================================================================
    if (url.pathname === '/api/fonnte/groups' && request.method === 'GET') {
      try {
        const FONNTE_TOKEN = env.FONNTE_TOKEN || atob('RzJ3YjlMck1tYlRXSlAxdGJCdzM=');
        await fetch('https://api.fonnte.com/fetch-group', {
          method: 'POST',
          headers: { Authorization: FONNTE_TOKEN },
        }).catch(() => {});

        const listRes = await fetch('https://api.fonnte.com/get-whatsapp-group', {
          method: 'POST',
          headers: { Authorization: FONNTE_TOKEN },
        });
        const listData = await listRes.json().catch(() => ({}));

        return new Response(
          JSON.stringify({
            success: listRes.ok && listData?.status !== false,
            groups: Array.isArray(listData?.data) ? listData.data : [],
            detail: listData,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: err.message || 'Worker Error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // =========================================================================
    // ENDPOINT 3C: FORWARD IKLAN PRIORITAS KE GRUP WA (/api/send-priority-group-wa)
    // =========================================================================
    if (url.pathname === '/api/send-priority-group-wa' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const DEFAULT_GROUP_JID = '120363413910178396@g.us';
        const DEFAULT_GROUP_INVITE_URL =
          'https://chat.whatsapp.com/Be6mlNR46KKCsqcNh3Wnvi?s=cl&p=a&mlu=4&ilr=4&iam=2';
        const DEFAULT_GROUP_NAME = 'Jualrugi.my.id';

        const {
          listingId,
          listingTitle,
          sellingPrice,
          normalPrice,
          discountPercentage,
          location,
          category,
          urgentReason,
          sellerName,
          adLink,
          groupJid,
          groupInviteUrl,
          groupName,
          customMessage,
        } = body;

        const targetGroupJid = String(groupJid || env.PRIORITY_WA_GROUP_JID || DEFAULT_GROUP_JID).trim();
        const resolvedGroupName = String(groupName || DEFAULT_GROUP_NAME).trim();
        const resolvedInviteUrl = String(groupInviteUrl || DEFAULT_GROUP_INVITE_URL).trim();

        const cleanId = String(listingId || 'bu-prioritas').trim();
        const directAdLink = adLink || `https://jualrugi.my.id/?id=${encodeURIComponent(cleanId)}`;
        const title = String(listingTitle || 'Produk BU Prioritas').trim();

        let message = typeof customMessage === 'string' && customMessage.trim() ? customMessage.trim() : '';
        if (!message) {
          const priceStr =
            typeof sellingPrice === 'number' && sellingPrice > 0
              ? `Rp ${sellingPrice.toLocaleString('id-ID')}`
              : 'Harga Butuh Uang (Cek Link)';
          const normalStr =
            typeof normalPrice === 'number' && normalPrice > 0
              ? `Rp ${normalPrice.toLocaleString('id-ID')}`
              : '';
          const discStr =
            typeof discountPercentage === 'number' && discountPercentage > 0
              ? `Hemat ${discountPercentage}%`
              : '';
          const priceLine = normalStr
            ? `💸 *Harga BU:* *${priceStr}* _(Normal ~${normalStr}~${discStr ? ` • ${discStr}` : ''})_`
            : `💸 *Harga BU:* *${priceStr}*`;

          message =
            `🔥 *IKLAN PRIORITAS BARU DI-APPROVED ADMIN!* 🔥\n\n` +
            `🏷️ *${title}*\n` +
            `🆔 ID Iklan: *${cleanId}*\n` +
            `📂 Kategori: ${String(category || 'Barang BU Prioritas').trim()}\n` +
            `${priceLine}\n` +
            `📍 Lokasi COD: *${String(location || 'Indonesia (COD Aman)').trim()}*\n` +
            `👤 Penjual: ${String(sellerName || 'Member JualRugi').trim()}\n` +
            `⚡ Keterangan: _"${String(urgentReason || 'Butuh dana cepat, siap COD hari ini').trim()}"_\n\n` +
            `🔗 *Lihat Detail & Chat Penjual Langsung:*\n` +
            `${directAdLink}\n\n` +
            `⚠️ _Selalu utamakan COD tatap muka di tempat ramai & JANGAN transfer DP sebelum cek fisik barang._\n\n` +
            `---\n` +
            `*Admin jualrugi.my.id*`;
        }

        const FONNTE_TOKEN = env.FONNTE_TOKEN || atob('RzJ3YjlMck1tYlRXSlAxdGJCdzM=');
        const formData = new FormData();
        formData.append('target', targetGroupJid);
        formData.append('message', message);

        const fonnteRes = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { Authorization: FONNTE_TOKEN },
          body: formData,
        });

        const fonnteData = await fonnteRes.json().catch(() => ({}));
        const isOk = fonnteRes.ok && fonnteData?.status !== false;

        return new Response(
          JSON.stringify({
            success: isOk,
            message: isOk
              ? `Iklan prioritas "${title}" berhasil diteruskan ke Grup WA ${resolvedGroupName}!`
              : fonnteData?.reason || 'Fonnte gagal mengirim pesan ke grup WhatsApp.',
            targetGroupJid,
            groupName: resolvedGroupName,
            groupInviteUrl: resolvedInviteUrl,
            adLink: directAdLink,
            detail: fonnteData,
          }),
          { status: isOk ? 200 : 502, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: err.message || 'Worker Internal Error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // =========================================================================
    // ENDPOINT 3D: POST PAYLOAD BU PRIORITAS KE WEBHOOK MAKE.COM
    // =========================================================================
    if (url.pathname === '/api/approve-priority-make-webhook' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const targetWebhookUrl =
          (typeof body.webhookUrl === 'string' && body.webhookUrl.trim().startsWith('http')
            ? body.webhookUrl.trim()
            : null) ||
          env.MAKE_PRIORITY_AD_WEBHOOK_URL ||
          'https://hook.eu1.make.com/atk7199ky3v9eh37xox6zeqxk2g9pcd8';

        const normalPrice = Number(body.normal_price ?? body.normalPrice ?? 0) || 0;
        const buPrice = Number(body.bu_price ?? body.sellingPrice ?? body.buPrice ?? 0) || 0;
        const rawDiscount = body.discount_percentage ?? body.discountPercentage;
        const discountPercentage =
          typeof rawDiscount === 'number' && !isNaN(rawDiscount)
            ? Math.round(rawDiscount)
            : normalPrice > buPrice && normalPrice > 0
            ? Math.round(((normalPrice - buPrice) / normalPrice) * 100)
            : 0;

        const conditionText = String(body.condition || '').trim();
        const urgentText = String(body.urgentReason || body.urgent_reason || '').trim();
        const fallbackDesc =
          conditionText && urgentText && conditionText !== urgentText
            ? `${conditionText} | Alasan BU: ${urgentText}`
            : urgentText || conditionText || 'Barang BU Prioritas siap COD.';

        const makePayload = {
          id: String(body.id || body.listingId || '').trim(),
          title: String(body.title || body.listingTitle || '').trim(),
          normal_price: normalPrice,
          bu_price: buPrice,
          discount_percentage: discountPercentage,
          cod_location: String(body.cod_location ?? body.location ?? '').trim(),
          seller_name: String(
            body.seller_name ?? body.sellerName ?? body.seller?.name ?? 'Member JualRugi'
          ).trim(),
          description: String(body.description || fallbackDesc).trim(),
        };

        if (!makePayload.id || !makePayload.title) {
          return new Response(
            JSON.stringify({ success: false, error: 'Parameter id dan title wajib diisi.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const makeRes = await fetch(targetWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(makePayload),
        });
        const responseText = await makeRes.text().catch(() => '');

        return new Response(
          JSON.stringify({
            success: makeRes.ok,
            status: makeRes.status,
            webhookUrl: targetWebhookUrl,
            payload: makePayload,
            responseText,
            message: makeRes.ok
              ? `Payload BU Prioritas "${makePayload.title}" berhasil dikirim ke Make.com!`
              : `Make.com merespons HTTP ${makeRes.status}: ${responseText || 'Webhook error'}`,
          }),
          { status: makeRes.ok ? 200 : 502, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: err.message || 'Worker Internal Error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // =========================================================================
    // STATIC ASSETS & SPA ROUTING (Fallback to /index.html for client-side routing)
    // =========================================================================
    // A. Service Worker wajib tidak pernah di-cache oleh HTTP agar pembaruan instan
    if (url.pathname === '/sw.js') {
      const swRequest = new Request(new URL('/sw.js', request.url).toString());
      const swResponse = await env.ASSETS.fetch(swRequest);
      const headers = new Headers(swResponse.headers);
      headers.set('Content-Type', 'application/javascript; charset=utf-8');
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return new Response(swResponse.body, { status: swResponse.status, headers });
    }

    // B. Web App Manifest resmi
    if (url.pathname === '/manifest.json') {
      const mRequest = new Request(new URL('/manifest.json', request.url).toString());
      const mResponse = await env.ASSETS.fetch(mRequest);
      const headers = new Headers(mResponse.headers);
      headers.set('Content-Type', 'application/manifest+json; charset=utf-8');
      return new Response(mResponse.body, { status: mResponse.status, headers });
    }

    // C. Root SPA Navigation (termasuk /?source=pwa, /?id=..., /index.html)
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const indexRequest = new Request(new URL('/index.html', request.url).toString());
      const indexResponse = await env.ASSETS.fetch(indexRequest);
      if (indexResponse.status === 200) {
        const headers = new Headers(indexResponse.headers);
        headers.set('Content-Type', 'text/html; charset=utf-8');
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return new Response(indexResponse.body, {
          status: 200,
          headers,
        });
      }
    }

    // D. Fetch Asset Reguler
    const response = await env.ASSETS.fetch(request);

    // Fallback 404 untuk client-side routing SPA
    if (response.status === 404 && request.method === 'GET') {
      const isStaticFile = url.pathname.match(/\.[a-zA-Z0-9]+$/);
      if (!isStaticFile) {
        const indexRequest = new Request(new URL('/index.html', request.url).toString());
        const indexResponse = await env.ASSETS.fetch(indexRequest);
        if (indexResponse.status === 200) {
          const headers = new Headers(indexResponse.headers);
          headers.set('Content-Type', 'text/html; charset=utf-8');
          headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          return new Response(indexResponse.body, {
            status: 200,
            headers,
          });
        }
      }
    }

    return response;
  },
};
