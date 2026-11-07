export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================================================
    // API ROUTE 1: /api/send-welcome-email (Cloudflare Worker Handler)
    // =========================================================================
    if (url.pathname === '/api/send-welcome-email' && request.method === 'POST') {
      console.log('[CF Worker - Welcome Email] Menerima request /api/send-welcome-email');
      try {
        const body = await request.json().catch(() => ({}));
        const { name, email, phone, city, brevoApiKey: clientKey } = body;
        const targetEmail = (email || '').trim();
        const userName = (name || 'Pengguna JualRugi').trim();
        const userPhone = (phone || '').trim();

        if (!targetEmail || !targetEmail.includes('@')) {
          return new Response(
            JSON.stringify({ success: false, error: 'Email tujuan tidak valid.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const activeBrevoKey =
          (env.BREVO_API_KEY && env.BREVO_API_KEY.trim() && !env.BREVO_API_KEY.includes('your_')
            ? env.BREVO_API_KEY.trim()
            : null) ||
          (clientKey && typeof clientKey === 'string' && clientKey.startsWith('xkeysib-')
            ? clientKey.trim()
            : null);

        const senderEmail = env.BREVO_SENDER_EMAIL || 'admin@jualrugi.my.id';
        const senderName = env.BREVO_SENDER_NAME || 'JualRugi.my.id';

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

        // Template Email
        const welcomeSubject = '🎉 Selamat Datang di JualRugi.my.id! Dapatkan Kuota Pasang Iklan Gratis';
        const welcomeHtml = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><title>Selamat Datang di JualRugi.my.id</title></head>
<body style="margin:0;padding:24px 16px;background-color:#f0f9ff;font-family:sans-serif;color:#0f172a;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:20px;border:1px solid #bae6fd;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <h2 style="color:#0369a1;margin:0 0 10px;">Halo, ${userName}! 👋</h2>
    <p style="font-size:14px;line-height:1.6;color:#334155;">
      Selamat bergabung di platform <strong>JualRugi.my.id</strong>. Akun Anda mendapatkan bonus <strong>1 Kuota Pasang Iklan Gratis</strong>.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://jualrugi.my.id/#pasangiklan" style="display:inline-block;background:#0284c7;color:#fff;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
        🚀 Pasang Iklan Sekarang
      </a>
      <div style="margin-top:12px;font-size:12px;color:#64748b;">
        Link langsung: <a href="https://jualrugi.my.id/#pasangiklan" style="color:#0284c7;">https://jualrugi.my.id/#pasangiklan</a>
      </div>
    </div>
  </div>
</body>
</html>`.trim();

        const welcomeText = `Halo ${userName}!\nSelamat datang di JualRugi.my.id. Pasang iklan barang BU Anda sekarang: https://jualrugi.my.id/#pasangiklan`;

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
          }),
        });

        const brevoData = await brevoRes.json().catch(() => ({}));
        console.log(`[CF Worker - Welcome Email] Brevo HTTP ${brevoRes.status}:`, brevoData);

        if (brevoRes.ok) {
          return new Response(
            JSON.stringify({
              success: true,
              message: `Welcome email berhasil dikirim via Brevo ke ${targetEmail}!`,
              messageId: brevoData.messageId,
              provider: 'brevo_cloudflare_worker',
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

        const activeBrevoKey =
          (env.BREVO_API_KEY && env.BREVO_API_KEY.trim() && !env.BREVO_API_KEY.includes('your_')
            ? env.BREVO_API_KEY.trim()
            : null);

        const senderEmail = env.BREVO_SENDER_EMAIL || 'admin@jualrugi.my.id';
        const senderName = env.BREVO_SENDER_NAME || 'JualRugi.my.id';

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
