import { getLatestPriorityAlert } from '../../../shared/webPushCore.js';

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      success: true,
      alert: getLatestPriorityAlert(),
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
