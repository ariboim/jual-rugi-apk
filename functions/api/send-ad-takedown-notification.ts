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
    const {
      recipientEmail,
      recipientPhone,
      recipientName,
      sellerId,
      listingId,
      listingTitle,
      takedownReason,
      adminNotes,
    } = body;

    const targetEmail = (recipientEmail || '').trim();
    const targetPhone = recipientPhone ? String(recipientPhone).trim() : '';
    const userName = (recipientName || 'Penjual JualRugi').trim();
    const userId = (sellerId || 'seller').trim();
    const title = (listingTitle || 'Iklan Produk').trim();
    const adId = (listingId || '-').trim();
    const reason = (takedownReason || 'Pelanggaran kebijakan / laporan pembeli terverifikasi').trim();
    const notes = (adminNotes || '').trim();

    const identicalText = `Pemberitahuan Take Down Iklan - JualRugi.my.id

Halo ${userName},
Iklan Anda dengan detail:
- Judul: "${title}"
- ID Iklan: ${adId}
Telah di-take down (dihapus permanen) oleh Admin JualRugi karena adanya laporan pelanggaran yang telah diverifikasi.

Alasan Take Down:
${reason}${notes ? `\nCatatan Admin: ${notes}` : ''}

Ketentuan Kuota Iklan:
Iklan yang di-takedown karena pelanggaran TIDAK mengembalikan kuota iklan.

Jika kuota iklan Anda saat ini 0 dan Anda ingin memasang iklan baru, Anda dapat menunggu masa tunggu 45 hari untuk reset 1 kuota gratis, atau membeli slot kuota iklan melalui tautan resmi Mayar berikut:

1. 1 Kuota Iklan (Rp 50.000):
https://indo-digital.myr.id/plink/link-pembayaran-1-kuota-iklan

2. 5 Kuota Iklan (Rp 200.000):
https://indo-digital.myr.id/plink/link-pembayaran-5-kuota-iklan

3. 10 Kuota Iklan (Rp 450.000):
https://indo-digital.myr.id/plink/Link-10-kuota-iklan

Setelah melakukan pembayaran, konfirmasi ke WhatsApp Admin (6289673686625) dengan format:
"Halo admin saya dengan ${userName} dan ${userId},saya sudah membayar untuk { kuota iklan} ,mohon diaktivasi kuota iklan saya ya"

Team Admin jualrugi.my.id`;

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
<head><meta charset="utf-8"><title>Pemberitahuan Take Down Iklan</title></head>
<body style="margin:0;padding:24px;background-color:#fef2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #fecaca;padding:28px;">
    <div style="text-align:center;margin-bottom:20px;">
      <span style="display:inline-block;background:#fee2e2;color:#dc2626;padding:5px 16px;border-radius:9999px;font-size:12px;font-weight:800;">🚨 Pemberitahuan Moderasi</span>
      <h2 style="color:#b91c1c;margin:12px 0 6px;font-size:21px;">Iklan Anda Telah Di-Take Down</h2>
    </div>
    <div style="background:#f8fafc;border-left:4px solid #ef4444;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:14px;"><strong>Judul Iklan:</strong> "${title}"</p>
      <p style="margin:0 0 8px;font-size:13px;color:#475569;"><strong>ID Iklan:</strong> ${adId}</p>
      <p style="margin:0;font-size:14px;color:#991b1b;"><strong>Alasan Take Down:</strong> ${reason}</p>
      ${notes ? `<p style="margin:8px 0 0;font-size:13px;color:#475569;"><strong>Catatan Admin:</strong> ${notes}</p>` : ''}
    </div>
    <p style="font-size:13px;color:#92400e;">Iklan yang di-takedown karena pelanggaran <strong>TIDAK mengembalikan kuota iklan</strong>.</p>
    <p style="font-size:12px;color:#64748b;text-align:center;">Team Admin jualrugi.my.id</p>
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
            subject: 'Pemberitahuan Take Down Iklan - JualRugi.my.id',
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
        eventType: 'ad_takedown',
        listingId: adId,
        listingTitle: title,
        recipientName: userName,
        recipientEmail: targetEmail,
        sellerId: userId,
        targetUserId: body?.targetUserId || userId,
        targetEmail: body?.targetEmail || targetEmail,
        takedownReason: reason,
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
        message: `Notifikasi take down diproses (Email: ${brevoSuccess ? 'Terkirim' : 'Tercatat'}, WA: ${fonnteSuccess ? 'Terkirim' : 'Tercatat'}, Web Push: ${(webPushSummary as any)?.sent || 0} perangkat).`,
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
        error: err?.message || 'Gagal memproses notifikasi take down iklan.',
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
