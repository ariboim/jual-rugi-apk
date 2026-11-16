import { getVapidConfig } from '../../../shared/webPushCore.js';

export async function onRequestGet(context: { env: Record<string, any> }) {
  const vapid = getVapidConfig(context.env || {});
  return new Response(
    JSON.stringify({
      success: true,
      publicKey: vapid.publicKey,
      subject: vapid.subject,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
