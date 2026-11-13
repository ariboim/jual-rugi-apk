interface Env {
  FONNTE_TOKEN?: string;
  PRIORITY_WA_GROUP_JID?: string;
}

const DEFAULT_GROUP_JID = '120363413910178396@g.us';
const DEFAULT_GROUP_INVITE_URL =
  'https://chat.whatsapp.com/Be6mlNR46KKCsqcNh3Wnvi?s=cl&p=a&mlu=4&ilr=4&iam=2';
const DEFAULT_GROUP_NAME = 'Jualrugi.my.id';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body: any = await request.json().catch(() => ({}));
    const {
      listingId,
      listingTitle,
      sellingPrice,
      normalPrice,
      discountPercentage,
      location,
      category,
      urgentReason,
      sellerName,
      adLink,
      imageUrl,
      image_url,
      groupJid,
      groupInviteUrl,
      groupName,
      customMessage,
    } = body;

    const targetGroupJid = String(
      groupJid || env.PRIORITY_WA_GROUP_JID || DEFAULT_GROUP_JID
    ).trim();
    const resolvedGroupName = String(groupName || DEFAULT_GROUP_NAME).trim();
    const resolvedInviteUrl = String(
      groupInviteUrl || DEFAULT_GROUP_INVITE_URL
    ).trim();

    const cleanId = String(listingId || 'bu-prioritas').trim();
    const directAdLink =
      adLink || `https://jualrugi.my.id/?id=${encodeURIComponent(cleanId)}`;
    const title = String(listingTitle || 'Produk BU Prioritas').trim();

    const DEFAULT_OG_LOGO_URL = 'https://jualrugi.my.id/og-image.jpg?v=3';
    const resolvePublicMediaUrl = (rawUrl: unknown): string => {
      const val = String(rawUrl || '').trim();
      if (!val || val.startsWith('data:') || val.startsWith('blob:')) {
        return DEFAULT_OG_LOGO_URL;
      }
      if (/^https?:\/\//i.test(val)) {
        if (val.includes('images.unsplash.com') && !val.includes('fm=')) {
          return `${val}${val.includes('?') ? '&' : '?'}fm=jpg`;
        }
        return val;
      }
      if (val.startsWith('/')) {
        return `https://jualrugi.my.id${val}`;
      }
      return DEFAULT_OG_LOGO_URL;
    };
    const resolvedMediaUrl = resolvePublicMediaUrl(imageUrl || image_url);

    let message =
      typeof customMessage === 'string' && customMessage.trim()
        ? customMessage.trim()
        : '';

    if (!message) {
      const priceStr =
        typeof sellingPrice === 'number' && sellingPrice > 0
          ? `Rp ${sellingPrice.toLocaleString('id-ID')}`
          : 'Harga Butuh Uang (Cek Link)';
      const normalStr =
        typeof normalPrice === 'number' && normalPrice > 0
          ? `Rp ${normalPrice.toLocaleString('id-ID')}`
          : '';
      const discStr =
        typeof discountPercentage === 'number' && discountPercentage > 0
          ? `Hemat ${discountPercentage}%`
          : '';
      const priceLine = normalStr
        ? `💸 *Harga BU:* *${priceStr}* _(Normal ~${normalStr}~${discStr ? ` • ${discStr}` : ''})_`
        : `💸 *Harga BU:* *${priceStr}*`;

      message =
        `🔥 *IKLAN PRIORITAS BARU DI-APPROVED ADMIN!* 🔥\n\n` +
        `🏷️ *${title}*\n` +
        `🆔 ID Iklan: *${cleanId}*\n` +
        `📂 Kategori: ${String(category || 'Barang BU Prioritas').trim()}\n` +
        `${priceLine}\n` +
        `📍 Lokasi COD: *${String(location || 'Indonesia (COD Aman)').trim()}*\n` +
        `👤 Penjual: ${String(sellerName || 'Member JualRugi').trim()}\n` +
        `⚡ Keterangan: _"${String(urgentReason || 'Butuh dana cepat, siap COD hari ini').trim()}"_\n\n` +
        `🔗 *Lihat Detail & Chat Penjual Langsung:*\n` +
        `${directAdLink}\n\n` +
        `⚠️ _Selalu utamakan COD tatap muka di tempat ramai & JANGAN transfer DP sebelum cek fisik barang._\n\n` +
        `---\n` +
        `*Admin jualrugi.my.id*`;
    }

    const FONNTE_TOKEN =
      env.FONNTE_TOKEN || atob('RzJ3YjlMck1tYlRXSlAxdGJCdzM=');
    const sendViaFonnte = async (attachMediaUrl?: string) => {
      const formData = new FormData();
      formData.append('target', targetGroupJid);
      formData.append('message', message);
      if (attachMediaUrl) {
        formData.append('url', attachMediaUrl);
      }
      const resp = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: FONNTE_TOKEN },
        body: formData,
      });
      const data: any = await resp.json().catch(() => ({}));
      return { ok: resp.ok && data?.status !== false, data };
    };

    let result = await sendViaFonnte(resolvedMediaUrl);
    let mediaFallbackUsed = false;

    if (!result.ok) {
      result = await sendViaFonnte();
      mediaFallbackUsed = result.ok;
    }

    const isOk = result.ok;
    const fonnteData = result.data;

    return new Response(
      JSON.stringify({
        success: isOk,
        message: isOk
          ? `Iklan prioritas "${title}" berhasil diteruskan ke Grup WA ${resolvedGroupName}!`
          : fonnteData?.reason ||
            'Fonnte gagal mengirim pesan ke grup WhatsApp.',
        targetGroupJid,
        groupName: resolvedGroupName,
        groupInviteUrl: resolvedInviteUrl,
        adLink: directAdLink,
        imageUrl: mediaFallbackUsed ? null : resolvedMediaUrl,
        mediaFallbackUsed,
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
        error: err.message || 'Gagal meneruskan notifikasi ke Grup WA.',
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
