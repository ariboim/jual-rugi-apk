interface Env {
  MAKE_PRIORITY_AD_WEBHOOK_URL?: string;
}

const DEFAULT_PRIORITY_MAKE_WEBHOOK_URL =
  'https://hook.eu1.make.com/atk7199ky3v9eh37xox6zeqxk2g9pcd8';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body: any = await request.json().catch(() => ({}));
    const targetWebhookUrl =
      (typeof body.webhookUrl === 'string' &&
      body.webhookUrl.trim().startsWith('http')
        ? body.webhookUrl.trim()
        : null) ||
      env.MAKE_PRIORITY_AD_WEBHOOK_URL ||
      DEFAULT_PRIORITY_MAKE_WEBHOOK_URL;

    const normalPrice = Number(body.normal_price ?? body.normalPrice ?? 0) || 0;
    const buPrice =
      Number(body.bu_price ?? body.sellingPrice ?? body.buPrice ?? 0) || 0;
    const rawDiscount = body.discount_percentage ?? body.discountPercentage;
    const discountPercentage =
      typeof rawDiscount === 'number' && !isNaN(rawDiscount)
        ? Math.round(rawDiscount)
        : normalPrice > buPrice && normalPrice > 0
        ? Math.round(((normalPrice - buPrice) / normalPrice) * 100)
        : 0;

    const conditionText = String(body.condition || '').trim();
    const urgentText = String(
      body.urgentReason || body.urgent_reason || ''
    ).trim();
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
        body.seller_name ??
          body.sellerName ??
          body.seller?.name ??
          'Member JualRugi'
      ).trim(),
      description: String(body.description || fallbackDesc).trim(),
    };

    if (!makePayload.id || !makePayload.title) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameter id dan title iklan wajib diisi.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
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
      {
        status: makeRes.ok ? 200 : 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Gagal memproses webhook Make.com BU Prioritas.',
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
