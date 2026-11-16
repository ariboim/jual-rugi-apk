import {
  PUSH_SUBSCRIPTIONS_SQL,
  getVapidConfig,
  listPushSubscriptions,
} from '../../../shared/webPushCore.js';

export async function onRequestGet(context: { env: Record<string, any> }) {
  try {
    const env = context.env || {};
    const vapid = getVapidConfig(env);
    const { subscriptions, supabaseConfigured, supabaseTableReady } =
      await listPushSubscriptions(env);

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
