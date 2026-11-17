const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const packageType = String(body.packageType || 'sundul').trim();
    const userId = String(body.userId || 'guest').trim();
    const listingId = String(body.listingId || 'general').trim();

    const isPriority = packageType === 'prioritas_bu' || packageType === 'superbu';
    const targetProduct = isPriority
      ? {
          name: 'Prioritas BU Banget',
          amount: 250000,
          baseUrl: 'https://indo-digital.myr.id/plink/link-pembayaran-iklan-prioritas-bu',
        }
      : {
          name: 'Sundul Iklan',
          amount: 50000,
          baseUrl: 'https://indo-digital.myr.id/plink/link-pembayaran-sundul-iklan',
        };

    const paymentUrl = `${targetProduct.baseUrl}?amount=${targetProduct.amount}&customer_id=${encodeURIComponent(
      userId
    )}&item_id=${encodeURIComponent(listingId)}`;

    return new Response(
      JSON.stringify({
        success: true,
        product: targetProduct.name,
        amount: targetProduct.amount,
        paymentUrl,
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Worker Internal Error' }),
      { status: 500, headers: JSON_HEADERS }
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
