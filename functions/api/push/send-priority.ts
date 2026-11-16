import { broadcastPriorityWebPush } from '../../../shared/webPushCore.js';

export async function onRequestPost(context: { request: Request; env: Record<string, any> }) {
  try {
    const url = new URL(context.request.url);
    const body: any = await context.request.json().catch(() => ({}));
    const summary = await broadcastPriorityWebPush(
      {
        ...body,
        siteOrigin: body.siteOrigin || url.origin,
      },
      context.env || {},
      null,
      body?.supabaseConfig || null
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
        error: err?.message || 'Gagal mengirim Web Push notifikasi.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
