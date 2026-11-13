interface Env {
  FONNTE_TOKEN?: string;
}

export async function onRequestGet(context: { env: Env }) {
  const { env } = context;

  try {
    const FONNTE_TOKEN =
      env.FONNTE_TOKEN || atob('RzJ3YjlMck1tYlRXSlAxdGJCdzM=');

    await fetch('https://api.fonnte.com/fetch-group', {
      method: 'POST',
      headers: { Authorization: FONNTE_TOKEN },
    }).catch(() => {});

    const listRes = await fetch('https://api.fonnte.com/get-whatsapp-group', {
      method: 'POST',
      headers: { Authorization: FONNTE_TOKEN },
    });
    const listData: any = await listRes.json().catch(() => ({}));

    return new Response(
      JSON.stringify({
        success: listRes.ok && listData?.status !== false,
        groups: Array.isArray(listData?.data) ? listData.data : [],
        detail: listData,
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
        error: err.message || 'Gagal mengambil daftar grup WhatsApp.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
