interface Env {
  FONNTE_TOKEN?: string;
  ADMIN_WHATSAPP_NUMBER?: string;
}

const DEFAULT_ADMIN_WA = '6289673686625';

function normalizeIndonesianPhone(raw?: unknown): string {
  const str = String(raw || '').trim();
  if (!str) return '';
  let digits = str.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  return digits.length >= 8 ? digits : '';
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body: any = await request.json().catch(() => ({}));
    const cleanId = String(body.listingId || '').trim();
    const title = String(body.listingTitle || '').trim();
    const reason = String(body.reasonLabel || body.reason || '').trim();

    if (!cleanId || !title || !reason) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameter listingId, listingTitle, dan reason wajib diisi.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const targetAdminPhone =
      normalizeIndonesianPhone(body.adminPhone || env.ADMIN_WHATSAPP_NUMBER) || DEFAULT_ADMIN_WA;

    const adLink =
      typeof body.adLink === 'string' && body.adLink.trim()
        ? body.adLink.trim()
        : `https://jualrugi.my.id/product/${encodeURIComponent(cleanId)}`;

    const priceNum = Number(body.listingPrice || 0);
    const priceText = priceNum > 0 ? `Rp ${priceNum.toLocaleString('id-ID')}` : '-';
    const notes = String(body.notes || '').trim() || 'Tidak ada catatan tambahan.';
    const reporter = String(body.reporterName || 'Pembeli').trim();
    const reporterContact = String(body.reporterContact || '-').trim();
    const sellerName = String(body.sellerName || '-').trim();
    const sellerId = String(body.sellerId || '-').trim();

    const message =
      typeof body.customMessage === 'string' && body.customMessage.trim()
        ? body.customMessage.trim()
        : `🚨 *PERINGATAN DINI MODERASI IKLAN - JUALRUGI.MY.ID* 🚨\n\n` +
          `Ada laporan baru dari pengguna yang memerlukan pengecekan Admin segera:\n\n` +
          `📌 *Judul Iklan:* ${title}\n` +
          `🆔 *ID Iklan:* ${cleanId}\n` +
          `💰 *Harga:* ${priceText}\n` +
          `📍 *Lokasi:* ${String(body.listingLocation || '-').trim()}\n` +
          `👤 *Penjual:* ${sellerName} (${sellerId})\n\n` +
          `⚠️ *Alasan Laporan:*\n*${reason}*\n` +
          `📝 *Kronologi / Catatan:*\n_${notes}_\n\n` +
          `📣 *Pelapor:* ${reporter} (${reporterContact})\n\n` +
          `🔗 *Link Detail Iklan (Cek / Take Down Manual):*\n${adLink}\n\n` +
          `Mohon segera lakukan pengecekan atau take-down melalui Dashboard Admin jika terbukti melanggar SOP COD aman.\n` +
          `---\n*Sistem Keamanan jualrugi.my.id*`;

    if (body.dryRun === true) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          targetAdminPhone,
          adLink,
          messagePreview: message,
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

    const FONNTE_TOKEN = env.FONNTE_TOKEN || atob('RzJ3YjlMck1tYlRXSlAxdGJCdzM=');
    const formData = new FormData();
    formData.append('target', targetAdminPhone);
    formData.append('message', message);
    formData.append('countryCode', '62');

    const fonnteRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: FONNTE_TOKEN },
      body: formData,
    });
    const fonnteData: any = await fonnteRes.json().catch(() => ({}));
    const isOk = fonnteRes.ok && fonnteData?.status !== false;

    return new Response(
      JSON.stringify({
        success: isOk,
        message: isOk
          ? `Peringatan laporan iklan ${cleanId} berhasil dikirim ke WA Admin (${targetAdminPhone}).`
          : fonnteData?.reason || 'Fonnte gagal mengirim notifikasi laporan ke Admin.',
        targetAdminPhone,
        adLink,
        detail: fonnteData,
      }),
      {
        status: isOk ? 200 : 502,
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
        error: err?.message || 'Gagal mengirim peringatan laporan ke WhatsApp Admin.',
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
