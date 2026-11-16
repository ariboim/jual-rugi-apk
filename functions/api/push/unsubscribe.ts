import { deletePushSubscription } from '../../../shared/webPushCore.js';

export async function onRequestPost(context: { request: Request; env: Record<string, any> }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const endpoint = body?.endpoint || body?.subscription?.endpoint;
    if (!endpoint) {
      return new Response(
        JSON.stringify({ success: false, error: 'Endpoint wajib disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    await deletePushSubscription(endpoint, context.env || {});
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Gagal menghapus subscription.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
