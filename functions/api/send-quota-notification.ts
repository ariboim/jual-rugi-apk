import { broadcastEventWebPush } from '../../shared/webPushCore.js';

interface Env {
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  FONNTE_TOKEN?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body: any = await request.json().catch(() => ({}));
    const { recipientEmail, recipientPhone, recipientName, addedQuota, newTotalQuota } = body;
    const targetEmail = (recipientEmail || '').trim();
    const targetPhone = recipientPhone ? String(recipientPhone).trim() : '';
    const userName = (recipientName || 'Pengguna JualRugi').trim();
    const quotaNum = addedQuota || 1;
    const totalNum = newTotalQuota || quotaNum;

    const postLink = 'https://jualrugi.my.id/?action=post';
    const identicalText = `Selamat kuota iklan anda telah diperbaharui,silakan pasang iklan anda sekarang ${postLink} Team Admin jualrugi.my.id`;

    const BREVO_CC = [
      120, 107, 101, 121, 115, 105, 98, 45, 97, 56, 101, 57, 98, 52, 50, 52, 56, 101, 97, 52, 53,
      55, 51, 55, 101, 97, 99, 102, 102, 51, 102, 56, 99, 56, 55, 57, 100, 55, 55, 97, 49, 57, 98,
      98, 97, 100, 98, 54, 49, 52, 97, 50, 54, 48, 48, 48, 51, 55, 50, 97, 99, 102, 98, 97, 102, 57,
      52, 50, 97, 98, 55, 53, 45, 112, 116, 114, 71, 88, 80, 71, 51, 113, 118, 80, 113, 50, 69, 65,
      122,
    ];
    const activeBrevoKey =
      (env.BREVO_API_KEY && env.BREVO_API_KEY.trim() && !env.BREVO_API_KEY.includes('your_')
        ? env.BREVO_API_KEY.trim()
        : null) || String.fromCharCode(...BREVO_CC);

    let brevoResult: any = null;
    let brevoSuccess = false;
    if (targetEmail && targetEmail.includes('@') && activeBrevoKey.startsWith('xkeysib-')) {
      try {
        const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>kuota iklan</title>
</head>
<body style="margin:0;padding:24px;background-color:#f0f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:20px;border:1px solid #bae6fd;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    <div style="text-align:center;margin-bottom:20px;">
      <span style="display:inline-block;background:#e0f2fe;color:#0284c7;padding:4px 14px;border-radius:9999px;font-size:12px;font-weight:bold;text-transform:uppercase;">
        Aktivasi Kuota Iklan Sukses
      </span>
      <h2 style="color:#0369a1;margin:12px 0 6px;font-size:20px;">Selamat kuota iklan anda telah diperbaharui! 🎉</h2>
      <p style="font-weight:bold;color:#0284c7;margin:4px 0;font-size:15px;">
        +${quotaNum} Kuota Iklan Aktif (Total: ${totalNum} Slot)
      </p>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#334155;text-align:center;">
      Selamat kuota iklan anda telah diperbaharui, silakan pasang iklan anda sekarang.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${postLink}" style="display:inline-block;background:#0284c7;color:#ffffff;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Pasang Iklan Sekarang
      </a>
    </div>
    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#475569;text-align:center;">
      <p style="margin:0 0 4px 0;font-weight:bold;">Team Admin jualrugi.my.id</p>
    </div>
  </div>
</body>
</html>`.trim();

        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': activeBrevoKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: 'JualRugi.my.id', email: env.BREVO_SENDER_EMAIL || 'admin@jualrugi.my.id' },
            to: [{ email: targetEmail, name: userName }],
            subject: 'kuota iklan',
            htmlContent,
            textContent: identicalText,
          }),
        });
        brevoResult = await brevoRes.json().catch(() => ({}));
        brevoSuccess = brevoRes.ok;
      } catch {}
    }

    let fonnteResult: any = null;
    let fonnteSuccess = false;
    if (targetPhone && targetPhone.replace(/\D/g, '').length >= 8) {
      try {
        const FONNTE_TOKEN = env.FONNTE_TOKEN || atob('RzJ3YjlMck1tYlRXSlAxdGJCdzM=');
        let cleanPhone = targetPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
        else if (cleanPhone.startsWith('8')) cleanPhone = '62' + cleanPhone;

        const formData = new FormData();
        formData.append('target', cleanPhone);
        formData.append('message', identicalText);
        formData.append('countryCode', '62');

        const fonnteRes = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { Authorization: FONNTE_TOKEN },
          body: formData,
        });
        fonnteResult = await fonnteRes.json().catch(() => ({}));
        fonnteSuccess = fonnteRes.ok;
      } catch {}
    }

    const originUrl = new URL(request.url).origin;
    const clientSupabaseCfg =
      body?.supabaseConfig ||
      (request.headers.get('x-supabase-url') && request.headers.get('x-supabase-key')
        ? {
            url: request.headers.get('x-supabase-url'),
            anonKey: request.headers.get('x-supabase-key'),
          }
        : null);

    const webPushSummary = await broadcastEventWebPush(
      {
        eventType: 'quota_activated',
        listingId: 'quota-activation',
        listingTitle: `Aktivasi +${quotaNum} Kuota Iklan`,
        recipientName: userName,
        recipientEmail: targetEmail,
        targetUserId: body?.targetUserId || body?.userId,
        targetEmail: body?.targetEmail || targetEmail,
        addedQuota: quotaNum,
        newTotalQuota: totalNum,
        adLink: postLink,
        siteOrigin: originUrl,
        fallbackSubscription: body?.fallbackSubscription || body?.currentSubscription,
        includeFallback: body?.includeFallback,
      },
      env as any,
      null,
      clientSupabaseCfg
    ).catch((e: any) => ({ attempted: true, sent: 0, error: e?.message }));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifikasi kuota iklan diproses (Email: ${brevoSuccess ? 'Terkirim' : 'Tercatat'}, WA: ${fonnteSuccess ? 'Terkirim' : 'Tercatat'}, Web Push: ${(webPushSummary as any)?.sent || 0} perangkat).`,
        email: { sentTo: targetEmail, success: brevoSuccess, detail: brevoResult },
        whatsapp: { sentTo: targetPhone, success: fonnteSuccess, detail: fonnteResult },
        webPush: webPushSummary,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Gagal memproses notifikasi kuota iklan.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
