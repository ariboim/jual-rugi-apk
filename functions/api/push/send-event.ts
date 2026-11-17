import { broadcastEventWebPush } from '../../../shared/webPushCore.js';

export async function onRequestPost(context: { request: Request; env: Record<string, any> }) {
  try {
    const url = new URL(context.request.url);
    const body: any = await context.request.json().catch(() => ({}));
    const clientSupabaseCfg =
      body?.supabaseConfig ||
      (context.request.headers.get('x-supabase-url') &&
      context.request.headers.get('x-supabase-key')
        ? {
            url: context.request.headers.get('x-supabase-url'),
            anonKey: context.request.headers.get('x-supabase-key'),
          }
        : null);

    const summary = await broadcastEventWebPush(
      {
        ...body,
        siteOrigin: body.siteOrigin || url.origin,
      },
      context.env || {},
      null,
      clientSupabaseCfg
    );

    return new Response(JSON.stringify({ success: true, ...summary }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Gagal mengirim Web Push notifikasi event.',
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
