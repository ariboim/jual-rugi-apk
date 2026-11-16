/**
 * Native W3C Web Push Engine (VAPID RFC 8292 + AES128GCM RFC 8291)
 * Zero third-party push SaaS (Tanpa OneSignal / FCM SDK).
 * Kompatibel penuh dengan Node.js >= 20, Cloudflare Workers, & Cloudflare Pages Functions.
 */

const textEncoder = new TextEncoder();

// Default P-256 VAPID keypair yang valid secara kriptografis.
// Bisa di-override via environment variables: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
export const DEFAULT_VAPID_PUBLIC_KEY =
  'BJBBca3B8RGnsTpGjek3GXTYkls5NjZ1R2wgZ4nqH6jVzUSfPzPVvdwnI2WX8TnUiMTEBrfE_wVrnhMOSsPQETs';
const DEFAULT_VAPID_PRIVATE_D = 'KTYT0VLqVTKVX_gMWaavWgvxrw-vaT9QQHfuyudGBJc';
const DEFAULT_VAPID_SUBJECT = 'mailto:admin@jualrugi.my.id';

export const PUSH_SUBSCRIPTIONS_SQL = `CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  endpoint text PRIMARY KEY,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_id text,
  user_role text,
  user_agent text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert/update push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public insert/update push_subscriptions"
  ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);`;

function getMemoryStore() {
  if (!globalThis.__JUALRUGI_PUSH_SUBS__) {
    globalThis.__JUALRUGI_PUSH_SUBS__ = new Map();
  }
  return globalThis.__JUALRUGI_PUSH_SUBS__;
}

function getRecentPushMap() {
  if (!globalThis.__JUALRUGI_RECENT_PUSH__) {
    globalThis.__JUALRUGI_RECENT_PUSH__ = new Map();
  }
  return globalThis.__JUALRUGI_RECENT_PUSH__;
}

export function getLatestPriorityAlert() {
  const latest = globalThis.__JUALRUGI_LATEST_PRIORITY_ALERT__;
  if (!latest) return null;
  // Berlaku 15 menit untuk sinkronisasi tab web aktif
  if (Date.now() - (latest.timestamp || 0) > 15 * 60 * 1000) {
    return null;
  }
  return latest;
}

function recordLatestPriorityAlert(payload) {
  globalThis.__JUALRUGI_LATEST_PRIORITY_ALERT__ = {
    eventId: `${payload.listingId || 'bu'}-${payload.timestamp || Date.now()}`,
    ...payload,
  };
  return globalThis.__JUALRUGI_LATEST_PRIORITY_ALERT__;
}

export function uint8ArrayToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlToUint8Array(base64String) {
  const clean = String(base64String || '').trim().replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(clean + padding);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function concatUint8Arrays(arrays) {
  let totalLength = 0;
  for (const arr of arrays) totalLength += arr.length;
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function getVapidConfig(env = {}) {
  const envPub = String(env.VAPID_PUBLIC_KEY || env.VITE_VAPID_PUBLIC_KEY || '').trim();
  const envPriv = String(env.VAPID_PRIVATE_KEY || '').trim();
  const envSubject = String(env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT).trim();

  if (envPub.length >= 80 && envPriv.length >= 40) {
    try {
      const pubBytes = base64UrlToUint8Array(envPub);
      const privBytes = base64UrlToUint8Array(envPriv);
      if (pubBytes.length === 65 && pubBytes[0] === 0x04 && privBytes.length === 32) {
        return {
          publicKey: uint8ArrayToBase64Url(pubBytes),
          x: uint8ArrayToBase64Url(pubBytes.slice(1, 33)),
          y: uint8ArrayToBase64Url(pubBytes.slice(33, 65)),
          d: uint8ArrayToBase64Url(privBytes),
          subject: envSubject.startsWith('mailto:') || envSubject.startsWith('https://')
            ? envSubject
            : DEFAULT_VAPID_SUBJECT,
        };
      }
    } catch (_) {}
  }

  const defPubBytes = base64UrlToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
  return {
    publicKey: DEFAULT_VAPID_PUBLIC_KEY,
    x: uint8ArrayToBase64Url(defPubBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(defPubBytes.slice(33, 65)),
    d: DEFAULT_VAPID_PRIVATE_D,
    subject: envSubject.startsWith('mailto:') || envSubject.startsWith('https://')
      ? envSubject
      : DEFAULT_VAPID_SUBJECT,
  };
}

async function importVapidSigningKey(vapidConfig) {
  return globalThis.crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      x: vapidConfig.x,
      y: vapidConfig.y,
      d: vapidConfig.d,
      ext: true,
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

async function createVapidJwt(endpointUrl, vapidConfig) {
  const audience = new URL(endpointUrl).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 3600;

  const headerB64 = uint8ArrayToBase64Url(
    textEncoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  );
  const payloadB64 = uint8ArrayToBase64Url(
    textEncoder.encode(
      JSON.stringify({
        aud: audience,
        exp: expiration,
        sub: vapidConfig.subject,
      })
    )
  );

  const unsigned = `${headerB64}.${payloadB64}`;
  const signingKey = await importVapidSigningKey(vapidConfig);
  const signatureBuffer = await globalThis.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    textEncoder.encode(unsigned)
  );

  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
  return `${unsigned}.${signatureB64}`;
}

async function hmacSha256(keyBytes, dataBytes) {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, dataBytes);
  return new Uint8Array(sig);
}

/**
 * Enkripsi payload Web Push sesuai RFC 8291 (Content-Encoding: aes128gcm)
 */
export async function encryptWebPushPayload(subscription, payload) {
  const uaPublic = base64UrlToUint8Array(subscription?.keys?.p256dh || subscription?.p256dh);
  const authSecret = base64UrlToUint8Array(subscription?.keys?.auth || subscription?.auth);

  if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) {
    throw new Error('Kunci p256dh subscription tidak valid (harus 65 byte uncompressed P-256).');
  }
  if (authSecret.length !== 16) {
    throw new Error('Kunci auth subscription tidak valid (harus 16 byte).');
  }

  const plaintext = textEncoder.encode(
    typeof payload === 'string' ? payload : JSON.stringify(payload)
  );

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const asKeyPair = await globalThis.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  const asPublic = new Uint8Array(
    await globalThis.crypto.subtle.exportKey('raw', asKeyPair.publicKey)
  );
  const uaPublicKey = await globalThis.crypto.subtle.importKey(
    'raw',
    uaPublic,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const sharedSecretBuffer = await globalThis.crypto.subtle.deriveBits(
    { name: 'ECDH', public: uaPublicKey },
    asKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBuffer);

  // RFC 8291 Section 3.3 Key Derivation
  const prkKey = await hmacSha256(authSecret, sharedSecret);
  const keyInfo = concatUint8Arrays([
    textEncoder.encode('WebPush: info\0'),
    uaPublic,
    asPublic,
    new Uint8Array([1]),
  ]);
  const ikm = (await hmacSha256(prkKey, keyInfo)).slice(0, 32);

  // RFC 8188 aes128gcm CEK & Nonce Derivation
  const prk = await hmacSha256(salt, ikm);
  const cekInfo = concatUint8Arrays([
    textEncoder.encode('Content-Encoding: aes128gcm\0'),
    new Uint8Array([1]),
  ]);
  const cek = (await hmacSha256(prk, cekInfo)).slice(0, 16);

  const nonceInfo = concatUint8Arrays([
    textEncoder.encode('Content-Encoding: nonce\0'),
    new Uint8Array([1]),
  ]);
  const nonce = (await hmacSha256(prk, nonceInfo)).slice(0, 12);

  // Pad dengan delimiter record terakhir (0x02)
  const padded = concatUint8Arrays([plaintext, new Uint8Array([2])]);

  const aesKey = await globalThis.crypto.subtle.importKey(
    'raw',
    cek,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const ciphertext = new Uint8Array(
    await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, tagLength: 128 },
      aesKey,
      padded
    )
  );

  // Header biner aes128gcm: salt(16) + rs(4) + idlen(1) + keyid(65)
  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false);
  header[20] = asPublic.length;
  header.set(asPublic, 21);

  return concatUint8Arrays([header, ciphertext]);
}

export async function sendSingleWebPush(subscription, payload, env = {}) {
  const endpoint = String(subscription?.endpoint || '').trim();
  if (!endpoint || !/^https:\/\//i.test(endpoint)) {
    return { ok: false, status: 400, expired: true, error: 'Endpoint tidak valid' };
  }

  const vapidConfig = getVapidConfig(env);
  const jwt = await createVapidJwt(endpoint, vapidConfig);
  const encryptedBody = await encryptWebPushPayload(subscription, payload);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt}, k=${vapidConfig.publicKey}`,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      Urgency: 'high',
    },
    body: encryptedBody,
  });

  if (resp.ok) {
    return { ok: true, status: resp.status, expired: false };
  }

  const errText = await resp.text().catch(() => '');
  const expired = resp.status === 404 || resp.status === 410;
  return {
    ok: false,
    status: resp.status,
    expired,
    error: errText || `Push service HTTP ${resp.status}`,
  };
}

export function resolveSupabasePushCredentials(env = {}, clientConfig = null) {
  const envUrl = String(env.SUPABASE_URL || env.VITE_SUPABASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const envKey = String(
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''
  ).trim();

  const clientUrl = String(clientConfig?.url || '')
    .trim()
    .replace(/\/+$/, '');
  const clientKey = String(clientConfig?.anonKey || clientConfig?.key || '').trim();

  const isValidPair = (u, k) =>
    Boolean(u) &&
    u.startsWith('http') &&
    !u.includes('your-project-id') &&
    k.length > 20 &&
    !k.includes('...');

  if (isValidPair(envUrl, envKey)) {
    return { url: envUrl, key: envKey, valid: true };
  }
  if (isValidPair(clientUrl, clientKey)) {
    return { url: clientUrl, key: clientKey, valid: true };
  }
  return { url: '', key: '', valid: false };
}

function normalizeRecord(raw) {
  if (!raw) return null;
  const endpoint = String(raw.endpoint || '').trim();
  const p256dh = String(raw.p256dh || raw.keys?.p256dh || '').trim();
  const auth = String(raw.auth || raw.keys?.auth || '').trim();
  if (!endpoint || !p256dh || !auth) return null;
  return {
    endpoint,
    p256dh,
    auth,
    keys: { p256dh, auth },
    userId: String(raw.userId || raw.user_id || '').trim() || null,
    userRole: String(raw.userRole || raw.user_role || '').trim() || null,
    userAgent: String(raw.userAgent || raw.user_agent || '').slice(0, 220) || null,
    updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
  };
}

export async function upsertPushSubscription(rawSub, env = {}, localStore = null, clientConfig = null) {
  const normalized = normalizeRecord(rawSub);
  if (!normalized) {
    return { success: false, error: 'Payload subscription tidak lengkap.' };
  }

  // 1. Memory store (cepat & selalu tersedia)
  const mem = getMemoryStore();
  mem.set(normalized.endpoint, normalized);

  // 2. Local disk store (jika Express / Node.js)
  if (localStore && typeof localStore.load === 'function' && typeof localStore.save === 'function') {
    try {
      const existing = await localStore.load();
      const map = new Map();
      if (Array.isArray(existing)) {
        for (const item of existing) {
          const n = normalizeRecord(item);
          if (n) map.set(n.endpoint, n);
        }
      }
      map.set(normalized.endpoint, normalized);
      await localStore.save(Array.from(map.values()));
    } catch (e) {
      console.warn('[WebPush LocalSave Warn]:', e?.message || e);
    }
  }

  // 3. Supabase persistence (agar sinkron di Cloudflare Workers multi-edge)
  let persistedInSupabase = false;
  let supabaseError = null;
  const sb = resolveSupabasePushCredentials(env, clientConfig);
  if (sb.valid) {
    try {
      const res = await fetch(`${sb.url}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
        method: 'POST',
        headers: {
          apikey: sb.key,
          Authorization: `Bearer ${sb.key}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          endpoint: normalized.endpoint,
          p256dh: normalized.p256dh,
          auth: normalized.auth,
          user_id: normalized.userId,
          user_role: normalized.userRole,
          user_agent: normalized.userAgent,
          updated_at: normalized.updatedAt,
        }),
      });
      if (res.ok) {
        persistedInSupabase = true;
      } else {
        supabaseError = await res.text().catch(() => `HTTP ${res.status}`);
      }
    } catch (e) {
      supabaseError = e?.message || 'Supabase fetch error';
    }
  }

  const all = await listPushSubscriptions(env, localStore, clientConfig);
  return {
    success: true,
    persistedInSupabase,
    supabaseConfigured: sb.valid,
    supabaseError,
    totalSubscribers: all.subscriptions.length,
  };
}

export async function deletePushSubscription(endpoint, env = {}, localStore = null, clientConfig = null) {
  const cleanEndpoint = String(endpoint || '').trim();
  if (!cleanEndpoint) return { success: false };

  const mem = getMemoryStore();
  mem.delete(cleanEndpoint);

  if (localStore && typeof localStore.load === 'function' && typeof localStore.save === 'function') {
    try {
      const existing = await localStore.load();
      if (Array.isArray(existing)) {
        await localStore.save(existing.filter((item) => item?.endpoint !== cleanEndpoint));
      }
    } catch (_) {}
  }

  const sb = resolveSupabasePushCredentials(env, clientConfig);
  if (sb.valid) {
    try {
      await fetch(
        `${sb.url}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(cleanEndpoint)}`,
        {
          method: 'DELETE',
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
        }
      );
    } catch (_) {}
  }

  return { success: true };
}

export async function listPushSubscriptions(env = {}, localStore = null, clientConfig = null) {
  const combined = new Map();
  const mem = getMemoryStore();

  for (const [k, v] of mem.entries()) {
    const n = normalizeRecord(v);
    if (n) combined.set(k, n);
  }

  if (localStore && typeof localStore.load === 'function') {
    try {
      const diskRows = await localStore.load();
      if (Array.isArray(diskRows)) {
        for (const row of diskRows) {
          const n = normalizeRecord(row);
          if (n) {
            combined.set(n.endpoint, n);
            mem.set(n.endpoint, n);
          }
        }
      }
    } catch (_) {}
  }

  const sb = resolveSupabasePushCredentials(env, clientConfig);
  let supabaseTableReady = false;
  if (sb.valid) {
    try {
      const res = await fetch(
        `${sb.url}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth,user_id,user_role,updated_at&order=updated_at.desc&limit=500`,
        {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
            Accept: 'application/json',
          },
        }
      );
      if (res.ok) {
        supabaseTableReady = true;
        const rows = await res.json().catch(() => []);
        if (Array.isArray(rows)) {
          for (const row of rows) {
            const n = normalizeRecord(row);
            if (n) {
              combined.set(n.endpoint, n);
              mem.set(n.endpoint, n);
            }
          }
        }
      }
    } catch (_) {}
  }

  return {
    subscriptions: Array.from(combined.values()),
    supabaseConfigured: sb.valid,
    supabaseTableReady,
  };
}

export function buildPriorityPushPayload(input = {}) {
  const cleanId = String(input.listingId || 'bu-prioritas').trim();
  const titleText = String(input.listingTitle || 'Barang BU Prioritas Baru').trim();
  const sellingPrice = Number(input.sellingPrice || 0);
  const discountPercentage = Number(input.discountPercentage || 0);
  const location = String(input.location || 'Indonesia (COD Aman)').trim();

  const priceLabel =
    sellingPrice > 0 ? `Rp ${sellingPrice.toLocaleString('id-ID')}` : 'Harga BU Spesial';
  const discLabel = discountPercentage > 0 ? ` • Hemat ${discountPercentage}%` : '';

  const siteOrigin = String(input.siteOrigin || 'https://jualrugi.my.id').replace(/\/+$/, '');
  const adLink =
    input.adLink && /^https?:\/\//i.test(input.adLink)
      ? input.adLink
      : `${siteOrigin}/?id=${encodeURIComponent(cleanId)}`;

  const rawImg = String(input.imageUrl || input.image_url || '').trim();
  let resolvedImage = `${siteOrigin}/og-image.jpg?v=3`;
  if (rawImg && !rawImg.startsWith('data:') && !rawImg.startsWith('blob:')) {
    if (/^https?:\/\//i.test(rawImg)) {
      resolvedImage =
        rawImg.includes('images.unsplash.com') && !rawImg.includes('fm=')
          ? `${rawImg}${rawImg.includes('?') ? '&' : '?'}fm=jpg`
          : rawImg;
    } else if (rawImg.startsWith('/')) {
      resolvedImage = `${siteOrigin}${rawImg}`;
    }
  }

  return {
    source: 'jualrugi-webpush',
    type: 'priority_bu',
    listingId: cleanId,
    listingTitle: titleText,
    sellingPrice,
    discountPercentage,
    location,
    title: `🔥 BU PRIORITAS: ${titleText}`,
    body: `${priceLabel}${discLabel} • COD ${location}. Klik untuk cek & tawar sebelum terjual!`,
    icon: '/pwa-192x192.png',
    badge: '/favicon.png',
    image: resolvedImage,
    tag: `jualrugi-priority-${cleanId}`,
    url: `/?id=${encodeURIComponent(cleanId)}`,
    adLink,
    timestamp: Date.now(),
    isTest: Boolean(input.isTest),
  };
}

/**
 * Mengirim Push Notifikasi ke seluruh perangkat subscriber secara bersamaan (tanpa pihak ketiga),
 * sekaligus mencatat alert terbaru untuk pengunjung web yang sedang aktif membuka aplikasi.
 */
export async function broadcastPriorityWebPush(input = {}, env = {}, localStore = null, clientConfig = null) {
  const cleanId = String(input.listingId || 'bu-prioritas').trim();
  const isTest = Boolean(input.isTest);
  const payload = buildPriorityPushPayload(input);
  const latestAlert = recordLatestPriorityAlert(payload);

  // Deduplikasi singkat 6 detik agar tidak double-push jika dipanggil dari 2 jalur serentak
  if (!isTest) {
    const recent = getRecentPushMap();
    const lastSent = recent.get(cleanId);
    if (lastSent && Date.now() - lastSent < 6000) {
      return {
        attempted: false,
        deduplicated: true,
        sent: 0,
        failed: 0,
        removedExpired: 0,
        totalSubscribers: getMemoryStore().size,
        latestAlert,
      };
    }
    recent.set(cleanId, Date.now());
  }

  const resolvedClientConfig = clientConfig || input.supabaseConfig || null;
  const { subscriptions, supabaseConfigured, supabaseTableReady } = await listPushSubscriptions(
    env,
    localStore,
    resolvedClientConfig
  );

  if (subscriptions.length === 0) {
    return {
      attempted: true,
      sent: 0,
      failed: 0,
      removedExpired: 0,
      totalSubscribers: 0,
      supabaseConfigured,
      supabaseTableReady,
      latestAlert,
      message: 'Belum ada perangkat yang mengaktifkan izin Push Notifikasi OS.',
    };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendSingleWebPush(sub, payload, env))
  );

  let sent = 0;
  let failed = 0;
  let removedExpired = 0;
  const errors = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const sub = subscriptions[i];
    if (r.status === 'fulfilled' && r.value?.ok) {
      sent++;
    } else {
      failed++;
      const errMsg =
        r.status === 'fulfilled' ? r.value?.error : r.reason?.message || 'Unknown push error';
      if (errors.length < 3) errors.push(errMsg);
      if (r.status === 'fulfilled' && r.value?.expired) {
        removedExpired++;
        await deletePushSubscription(sub.endpoint, env, localStore, resolvedClientConfig);
      }
    }
  }

  return {
    attempted: true,
    sent,
    failed,
    removedExpired,
    totalSubscribers: Math.max(0, subscriptions.length - removedExpired),
    supabaseConfigured,
    supabaseTableReady,
    latestAlert,
    errors: errors.length > 0 ? errors : undefined,
    payloadSummary: {
      title: payload.title,
      url: payload.url,
    },
  };
}
