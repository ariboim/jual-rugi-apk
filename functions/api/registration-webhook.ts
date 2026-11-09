/**
 * Cloudflare Pages Function: /api/registration-webhook
 * Menerima payload registrasi dari web frontend dan meneruskannya ke Make.com Webhook.
 * Kebal dari masalah Browser CORS karena dieksekusi secara Server-to-Server di edge Cloudflare.
 */

export async function onRequestPost(context: { request: Request }) {
  const { request } = context;

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

    const nama = (body.nama || body.fullName || body.name || body.nama_user || 'Member JualRugi').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const rawPhone = (body.nomor_wa || body.whatsapp || body.phone || body.no_whatsapp || '').trim();

    // Normalisasi nomor WhatsApp
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }
    const nomor_wa = cleanPhone || rawPhone;

    const DEFAULT_MAKE_URL = 'https://hook.eu1.make.com/1i6d9bq5157dnksxju764f8uno3bdsam';
    const FALLBACK_MAKE_URL = 'https://hook.eu1.make.com/1i6d9bq5i57dnksxju764f8uno3bdsam';

    const targetWebhook =
      (body.webhookUrl && typeof body.webhookUrl === 'string' && body.webhookUrl.startsWith('http')
        ? body.webhookUrl.trim()
        : null) || DEFAULT_MAKE_URL;

    console.log(`[CF Pages - Registration Webhook] Forwarding ke Make.com: ${targetWebhook}`);
    console.log(`[CF Pages - Registration Webhook Data]: nama=${nama}, email=${email}, nomor_wa=${nomor_wa}`);

    const payload = {
      nama,
      email,
      password,
      nomor_wa,
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
