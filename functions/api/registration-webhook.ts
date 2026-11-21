/**
 * Cloudflare Pages Function: /api/registration-webhook
 * Menerima payload registrasi dari web frontend dan meneruskannya ke Make.com Webhook.
 * Kebal dari masalah Browser CORS karena dieksekusi secara Server-to-Server di edge Cloudflare.
 */

import { upsertRegisteredUser, claimOnceDispatch } from '../../shared/usersCore.js';

export async function onRequestPost(context: { request: Request; env?: any }) {
  const { request, env } = context;

  console.log('[CF Pages - Registration Webhook] Menerima request /api/registration-webhook');

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Format body request harus JSON valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (body?.type === 'UPDATE' && body?.table === 'users') {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: 'Supabase UPDATE event diabaikan agar tidak memicu double action webhook.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const srcBody = body?.record && typeof body.record === 'object' ? body.record : body;
    const nama = (srcBody.nama || srcBody.fullName || srcBody.name || srcBody.nama_user || 'Member JualRugi').trim();
    const email = (srcBody.email || '').trim().toLowerCase();
    const password = srcBody.password || body.password || '';
    const rawPhone = (srcBody.nomor_wa || srcBody.whatsapp || srcBody.phone || srcBody.no_whatsapp || '').trim();

    // Normalisasi nomor WhatsApp
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }
    const nomor_wa = cleanPhone || rawPhone;

    if (
      !body?.forceTest &&
      email &&
      !claimOnceDispatch('cf-registration-webhook', `${email}|${nomor_wa}`, 120000)
    ) {
      return new Response(
        JSON.stringify({
          success: true,
          deduplicated: true,
          message: 'Webhook registrasi untuk user ini sudah diproses (deduplicated).',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (email && email.includes('@')) {
      await upsertRegisteredUser(
        {
          id: body.id,
          name: nama,
          email,
          password,
          whatsapp: nomor_wa,
          phone: nomor_wa,
          city: body.city || 'Jakarta Selatan',
          role: 'buyer',
        },
        env || {},
        null,
        body?.supabaseConfig || null,
        request.headers
      ).catch(() => {});
    }

    const DEFAULT_MAKE_URL = 'https://hook.eu1.make.com/1i6d9bq5157dnksxju764f8uno3bdsam';
    const FALLBACK_MAKE_URL = 'https://hook.eu1.make.com/1i6d9bq5i57dnksxju764f8uno3bdsam';

    const targetWebhook =
      (body.webhookUrl && typeof body.webhookUrl === 'string' && body.webhookUrl.startsWith('http')
        ? body.webhookUrl.trim()
        : null) || DEFAULT_MAKE_URL;

    console.log(`[CF Pages - Registration Webhook] Forwarding ke Make.com: ${targetWebhook}`);
    console.log(`[CF Pages - Registration Webhook Data]: nama=${nama}, email=${email}, nomor_wa=${nomor_wa}`);

    const group_wa_url =
      (typeof body.group_wa_url === 'string' && body.group_wa_url.trim()) ||
      'https://chat.whatsapp.com/Be6mlNR46KKCsqcNh3Wnvi';

    const pesan_wa =
      (typeof body.pesan_wa === 'string' && body.pesan_wa.trim()) ||
      `Halo *${nama}*! 👋\n\n` +
        `Selamat datang di *jualrugi.my.id* — Platform Jual Beli Barang Bekas & Preloved Paling Praktis!\n\n` +
        `Akun Anda dengan email *${email}* telah berhasil dibuat dan aktif sepenuhnya. Sekarang Anda sudah bisa mulai pasang iklan gratis atau mencari barang impian dengan penawaran terbaik.\n\n` +
        `🔗 *Yuk pasang iklan sekarang*\n` +
        `di https://jualrugi.my.id/#pasangiklan\n\n` +
        `💬 *Yuk gabung Grup WhatsApp Komunitas JualRugi.my.id* untuk update barang BU harga miring & info promo terbaru:\n` +
        `👉 ${group_wa_url}\n\n` +
        `Jika butuh bantuan, tim kami siap membantu kapan saja. Silakan simpan nomor wa ini sebagai admin. Selamat bertransaksi, bro/sis! 🚀\n\n` +
        `---\n*jualrugi.my.id*`;

    const payload = {
      nama,
      email,
      password,
      nomor_wa,
      pesan_wa,
      group_wa_url,
    };

    let makeRes = await fetch(targetWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let responseText = await makeRes.text().catch(() => '');
    console.log(`[CF Pages - Registration Webhook] Make.com HTTP ${makeRes.status}: ${responseText}`);

    // Jika 157 not found, fallback otomatis ke i57
    if ((!makeRes.ok || responseText.includes('Webhook not found')) && targetWebhook !== FALLBACK_MAKE_URL) {
      console.log(`[CF Pages - Registration Webhook] Trying fallback: ${FALLBACK_MAKE_URL}`);
      try {
        const fbRes = await fetch(FALLBACK_MAKE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const fbText = await fbRes.text().catch(() => '');
        if (fbRes.ok) {
          makeRes = fbRes;
          responseText = fbText;
        }
      } catch (fbErr) {
        console.warn('[CF Pages] Fallback webhook error:', fbErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data registrasi berhasil diteruskan ke Make.com. Happy shopping!',
        status: makeRes.status,
        makeResponse: responseText,
        data: payload,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    console.error('[CF Pages - Registration Webhook Error]:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Terjadi kesalahan internal Cloudflare Pages.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
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
