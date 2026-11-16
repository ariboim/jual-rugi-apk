import { getLatestPriorityAlert } from '../../../shared/webPushCore.js';

export async function onRequestGet(context?: { request?: Request }) {
  let userIdentifiers: string[] = [];
  try {
    if (context?.request?.url) {
      const url = new URL(context.request.url);
      userIdentifiers = [
        url.searchParams.get('userId') || '',
        url.searchParams.get('email') || '',
      ].filter(Boolean);
    }
  } catch {}

  return new Response(
    JSON.stringify({
      success: true,
      alert: getLatestPriorityAlert(userIdentifiers),
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
