import {
  PUSH_SUBSCRIPTIONS_SQL,
  getVapidConfig,
  listPushSubscriptions,
} from '../../../shared/webPushCore.js';

async function handleStatusRequest(request: Request, env: Record<string, any>) {
  try {
    const body: any =
      request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const clientConfig =
      body?.supabaseConfig ||
      (request.headers.get('x-supabase-url') && request.headers.get('x-supabase-key')
        ? {
            url: request.headers.get('x-supabase-url'),
            anonKey: request.headers.get('x-supabase-key'),
          }
        : null);

    const vapid = getVapidConfig(env);
    const { subscriptions, supabaseConfigured, supabaseTableReady } =
      await listPushSubscriptions(env, null, clientConfig);

    return new Response(
      JSON.stringify({
        success: true,
        configured: true,
        engine: 'native-webpush-vapid',
        publicKey: vapid.publicKey,
        totalSubscribers: subscriptions.length,
        supabaseConfigured,
        supabaseTableReady,
        sqlSetup: PUSH_SUBSCRIPTIONS_SQL,
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
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Gagal membaca status push notification.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestGet(context: { request: Request; env: Record<string, any> }) {
  return handleStatusRequest(context.request, context.env || {});
}

export async function onRequestPost(context: { request: Request; env: Record<string, any> }) {
  return handleStatusRequest(context.request, context.env || {});
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-supabase-url, x-supabase-key',
    },
  });
}
