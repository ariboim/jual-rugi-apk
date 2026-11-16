import { upsertPushSubscription } from '../../../shared/webPushCore.js';

export async function onRequestPost(context: { request: Request; env: Record<string, any> }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const targetSub =
      body.subscription || (body.endpoint ? { endpoint: body.endpoint, keys: body.keys } : null);

    if (!targetSub?.endpoint || !targetSub?.keys?.p256dh || !targetSub?.keys?.auth) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Data PushSubscription (endpoint, keys.p256dh, keys.auth) wajib dikirim.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await upsertPushSubscription(
      {
        endpoint: targetSub.endpoint,
        keys: targetSub.keys,
        userId: body.userId,
        userRole: body.userRole,
        userAgent: body.userAgent || context.request.headers.get('user-agent') || '',
      },
      context.env || {},
      null,
      body?.supabaseConfig || null
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Gagal menyimpan subscription.' }),
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
