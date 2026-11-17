/**
 * Service untuk Push Notifikasi Browser & Simulasi Moderasi Iklan
 * Mendukung Web Push Notification (Desktop & Android PWA) serta fallback In-App Toast.
 */
import { getSupabaseCredentials, isSupabaseConfigured } from './supabase';

function getOptionalSupabaseConfig() {
  try {
    if (isSupabaseConfigured()) {
      return getSupabaseCredentials();
    }
  } catch {}
  return undefined;
}

export type WebPushEventType = 'priority_bu' | 'ad_published' | 'quota_activated' | 'ad_takedown';

export interface PriorityWebAlertPayload {
  type?: WebPushEventType;
  eventType?: WebPushEventType;
  eventId?: string;
  targetUserId?: string;
  targetEmail?: string;
  listingId: string;
  listingTitle: string;
  title: string;
  body: string;
  sellingPrice?: number;
  discountPercentage?: number;
  location?: string;
  image?: string;
  adLink?: string;
  url?: string;
  timestamp: number;
  isTest?: boolean;
}

export const PRIORITY_ALERT_EVENT = 'jualrugi-priority-alert';
export const PRIORITY_ALERT_CHANNEL = 'jualrugi-priority-alerts';

export function emitLocalPriorityWebAlert(
  input: Partial<PriorityWebAlertPayload> & { listingId: string; listingTitle: string }
): PriorityWebAlertPayload {
  const eventType: WebPushEventType = input.eventType || input.type || 'priority_bu';
  const cleanId = String(input.listingId || (eventType === 'quota_activated' ? 'quota-activation' : 'bu-prioritas')).trim();
  const cleanTitle = String(input.listingTitle || 'Pemberitahuan JualRugi.my.id').trim();
  const sellingPrice = Number(input.sellingPrice || 0);
  const discountPercentage = Number(input.discountPercentage || 0);
  const location = String(input.location || 'Indonesia (COD Aman)').trim();
  const priceLabel =
    sellingPrice > 0 ? `Rp ${sellingPrice.toLocaleString('id-ID')}` : 'Harga BU Spesial';
  const discLabel = discountPercentage > 0 ? ` • Hemat ${discountPercentage}%` : '';

  let defaultTitle = `🔥 BU PRIORITAS: ${cleanTitle}`;
  let defaultBody = `${priceLabel}${discLabel} • COD ${location}. Klik untuk cek & tawar sebelum terjual!`;
  let defaultUrl = `/?id=${encodeURIComponent(cleanId)}`;
  let defaultAdLink = `https://jualrugi.my.id/?id=${encodeURIComponent(cleanId)}`;

  if (eventType === 'ad_published') {
    defaultTitle = `🎉 Iklan Resmi Tayang: ${cleanTitle}`;
    defaultBody = `Selamat! Iklan "${cleanTitle}" sudah aktif tayang di JualRugi.my.id.`;
  } else if (eventType === 'quota_activated') {
    defaultTitle = '⚡ Kuota Iklan Sudah Aktif!';
    defaultBody = 'Selamat kuota iklan Anda telah diperbarui. Silakan pasang iklan Anda sekarang!';
    defaultUrl = '/?action=post';
    defaultAdLink = 'https://jualrugi.my.id/?action=post';
  } else if (eventType === 'ad_takedown') {
    defaultTitle = `🚨 Iklan Di-Take Down Admin: ${cleanTitle}`;
    defaultBody = `Iklan "${cleanTitle}" dihapus permanen karena laporan pembeli terverifikasi. Kuota iklan tidak dikembalikan.`;
    defaultUrl = `/?status=takedown&id=${encodeURIComponent(cleanId)}`;
    defaultAdLink = `https://jualrugi.my.id/?status=takedown&id=${encodeURIComponent(cleanId)}`;
  }

  const alertPayload: PriorityWebAlertPayload = {
    type: eventType,
    eventType,
    eventId: input.eventId || `${eventType}-${cleanId}-${Number(input.timestamp || Date.now())}`,
    targetUserId: input.targetUserId,
    targetEmail: input.targetEmail,
    listingId: cleanId,
    listingTitle: cleanTitle,
    title: input.title || defaultTitle,
    body: input.body || defaultBody,
    sellingPrice: sellingPrice || undefined,
    discountPercentage: discountPercentage || undefined,
    location,
    image: input.image,
    adLink: input.adLink || defaultAdLink,
    url: input.url || defaultUrl,
    timestamp: Number(input.timestamp || Date.now()),
    isTest: Boolean(input.isTest),
  };

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(PRIORITY_ALERT_EVENT, { detail: alertPayload }));
    } catch {}
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel(PRIORITY_ALERT_CHANNEL);
        bc.postMessage(alertPayload);
        bc.close();
      }
    } catch {}
  }

  return alertPayload;
}

export async function fetchLatestPriorityWebAlert(
  userId?: string,
  email?: string
): Promise<PriorityWebAlertPayload | null> {
  try {
    const params = new URLSearchParams();
    if (userId && userId !== 'guest') params.set('userId', userId);
    if (email) params.set('email', email);
    const qs = params.toString();
    const res = await fetch(qs ? `/api/push/latest?${qs}` : '/api/push/latest');
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (data?.alert?.listingId) {
      return data.alert as PriorityWebAlertPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export interface PendingModeration {
  id: string;
  listingTitle: string;
  category: string;
  createdAt: number;
  triggerAt: number; // timestamp when push notification should trigger
  completed?: boolean;
}

const STORAGE_PENDING_KEY = 'jualrugi_pending_moderations';

/**
 * Meminta izin notifikasi browser jika didukung
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Gagal meminta izin notifikasi:', e);
    }
  }

  return Notification.permission;
}

/**
 * Mengirim push notification ke sistem OS atau Service Worker
 */
export async function sendSystemPushNotification(
  title: string,
  body: string,
  customOptions?: Record<string, any>
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: any = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/favicon.png',
    tag: 'jualrugi-ad-moderation',
    renotify: true,
    data: {
      url: window.location.origin,
      timestamp: Date.now(),
    },
    // Pattern getar: bip bip
    vibrate: [200, 100, 200],
    ...customOptions,
  };

  // Coba kirim via Service Worker Registration terlebih dahulu (Standar PWA/Mobile)
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    }
  } catch (swErr) {
    console.warn('Gagal menampilkan notifikasi via ServiceWorker, fallback ke Notification constructor:', swErr);
  }

  // Fallback ke Web Notification API langsung
  try {
    const notification = new Notification(title, notificationOptions);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch (err) {
    console.warn('Gagal membuat objek Notification:', err);
    return false;
  }
}

/**
 * Menyimpan moderasi iklan yang sedang berjalan ke LocalStorage
 */
export function savePendingModeration(moderation: PendingModeration): void {
  try {
    const list = getPendingModerations().filter((m) => m.id !== moderation.id);
    list.push(moderation);
    localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Gagal menyimpan pending moderasi:', e);
  }
}

/**
 * Mengambil daftar pending moderasi
 */
export function getPendingModerations(): PendingModeration[] {
  try {
    const raw = localStorage.getItem(STORAGE_PENDING_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Menghapus atau menandai selesai pending moderasi
 */
export function removePendingModeration(id: string): void {
  try {
    const list = getPendingModerations().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Gagal menghapus pending moderasi:', e);
  }
}

/**
 * Menjadwalkan notifikasi moderasi iklan selesai (Default 2.5 menit = 150.000 ms)
 * Parameter delayMs bisa disesuaikan (misal 150000 = 2.5 menit).
 */
export function scheduleModerationPushNotification(
  listingId: string,
  listingTitle: string,
  category: string,
  delayMs: number = 150000, // 2.5 menit
  onTriggered?: (notif: { title: string; body: string; listingId: string; viaPush: boolean }) => void
): () => void {
  const now = Date.now();
  const triggerAt = now + delayMs;

  const moderationData: PendingModeration = {
    id: listingId,
    listingTitle,
    category,
    createdAt: now,
    triggerAt,
  };

  savePendingModeration(moderationData);

  const title = 'Iklan Berhasil Tayang! 🎉';
  const body = `Selamat, iklan "${listingTitle}" Anda telah selesai dimoderasi dan resmi tayang di JualRugi.my.id.`;

  const timerId = window.setTimeout(async () => {
    // 1. Coba kirim via Web Push Notification
    const sentViaPush = await sendSystemPushNotification(title, body);

    // 2. Beri getaran feedback jika di mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {}
    }

    // 3. Panggil callback in-app fallback
    if (onTriggered) {
      onTriggered({
        title,
        body,
        listingId,
        viaPush: sentViaPush,
      });
    }

    removePendingModeration(listingId);
  }, delayMs);

  // Return cancel function
  return () => {
    window.clearTimeout(timerId);
    removePendingModeration(listingId);
  };
}

// ============================================================================
// NATIVE W3C WEB PUSH API (VAPID) - ZERO THIRD PARTY (TANPA ONESIGNAL)
// ============================================================================

const STORAGE_PUSH_MUTED_KEY = 'jualrugi_push_muted';
const FALLBACK_VAPID_PUBLIC_KEY =
  'BJBBca3B8RGnsTpGjek3GXTYkls5NjZ1R2wgZ4nqH6jVzUSfPzPVvdwnI2WX8TnUiMTEBrfE_wVrnhMOSsPQETs';

export interface WebPushClientState {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  muted: boolean;
  endpoint?: string;
}

export interface WebPushServerStatus {
  success: boolean;
  configured: boolean;
  engine?: string;
  publicKey?: string;
  totalSubscribers: number;
  supabaseConfigured?: boolean;
  supabaseTableReady?: boolean;
  sqlSetup?: string;
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getActiveServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js');
    } else {
      await reg.update().catch(() => {});
    }
    const readyReg = await navigator.serviceWorker.ready;
    return readyReg || reg;
  } catch (err) {
    console.warn('[WebPush] Gagal memperoleh ServiceWorkerRegistration:', err);
    return null;
  }
}

export async function fetchVapidPublicKey(): Promise<string> {
  try {
    const res = await fetch('/api/push/vapid-public-key');
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data?.publicKey && typeof data.publicKey === 'string') {
        return data.publicKey.trim();
      }
    }
  } catch (_) {}
  return FALLBACK_VAPID_PUBLIC_KEY;
}

export async function getWebPushClientState(): Promise<WebPushClientState> {
  if (!isWebPushSupported()) {
    return {
      supported: false,
      permission: 'unsupported',
      subscribed: false,
      muted: false,
    };
  }

  let muted = false;
  try {
    muted = localStorage.getItem(STORAGE_PUSH_MUTED_KEY) === 'true';
  } catch {}

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    return {
      supported: true,
      permission: Notification.permission,
      subscribed: Boolean(sub) && Notification.permission === 'granted',
      muted,
      endpoint: sub?.endpoint,
    };
  } catch {
    return {
      supported: true,
      permission: Notification.permission,
      subscribed: false,
      muted,
    };
  }
}

export async function getCurrentBrowserPushSubscriptionJson(): Promise<PushSubscriptionJSON | null> {
  if (!isWebPushSupported()) return null;
  if (Notification.permission !== 'granted') return null;
  try {
    if (localStorage.getItem(STORAGE_PUSH_MUTED_KEY) === 'true') return null;
  } catch {}
  try {
    const reg = await getActiveServiceWorkerRegistration();
    if (!reg || !reg.pushManager) return null;
    const sub = await reg.pushManager.getSubscription();
    return sub ? sub.toJSON() : null;
  } catch {
    return null;
  }
}

export async function subscribeToWebPushNotifications(meta?: {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}): Promise<{
  success: boolean;
  subscribed: boolean;
  totalSubscribers?: number;
  persistedInSupabase?: boolean;
  message: string;
}> {
  if (!isWebPushSupported()) {
    return {
      success: false,
      subscribed: false,
      message: 'Browser/perangkat ini belum mendukung Web Push Notification.',
    };
  }

  const inIframe = typeof window !== 'undefined' && window.self !== window.top;
  const permission = await requestBrowserNotificationPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      subscribed: false,
      message: inIframe
        ? 'Browser memblokir pop-up izin notifikasi di dalam frame Preview. Buka aplikasi di tab browser penuh (klik "Buka di Tab Baru ↗") lalu klik Aktifkan Push lagi.'
        : permission === 'denied'
        ? 'Izin notifikasi diblokir di browser. Aktifkan melalui ikon gembok/izin di address bar.'
        : 'Izin notifikasi belum diberikan.',
    };
  }

  try {
    localStorage.removeItem(STORAGE_PUSH_MUTED_KEY);
  } catch {}

  const reg = await getActiveServiceWorkerRegistration();
  if (!reg || !reg.pushManager) {
    return {
      success: false,
      subscribed: false,
      message: 'Service Worker belum siap. Muat ulang halaman lalu coba lagi.',
    };
  }

  const vapidPublicKey = await fetchVapidPublicKey();
  const appServerKey = urlBase64ToUint8Array(vapidPublicKey);

  let subscription = await reg.pushManager.getSubscription();
  if (subscription) {
    // Jika applicationServerKey sebelumnya berbeda (misal setelah rotasi VAPID key), perbarui subscription
    try {
      const existingKeyBuf = subscription.options?.applicationServerKey;
      if (existingKeyBuf) {
        const existingBytes = new Uint8Array(existingKeyBuf);
        const mismatch =
          existingBytes.length !== appServerKey.length ||
          existingBytes.some((b, idx) => b !== appServerKey[idx]);
        if (mismatch) {
          await subscription.unsubscribe();
          subscription = null;
        }
      }
    } catch {}
  }

  if (!subscription) {
    try {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
    } catch (subErr: any) {
      return {
        success: false,
        subscribed: false,
        message: `Gagal mendaftarkan PushManager: ${subErr?.message || 'Periksa dukungan HTTPS/PWA.'}`,
      };
    }
  }

  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId:
          [meta?.userId, meta?.userEmail]
            .map((v) => String(v || '').trim())
            .filter((v, idx, arr) => v && v !== 'guest' && arr.indexOf(v) === idx)
            .join('|') || 'guest',
        userRole: meta?.userRole || 'buyer',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        supabaseConfig: getOptionalSupabaseConfig(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok && data?.success !== false,
      subscribed: true,
      totalSubscribers: data?.totalSubscribers,
      persistedInSupabase: data?.persistedInSupabase,
      message:
        '🔔 Push Notifikasi Prioritas BU aktif! Notifikasi tetap masuk meski aplikasi ditutup.',
    };
  } catch (err: any) {
    return {
      success: false,
      subscribed: Boolean(subscription),
      message: `Subscription lokal aktif, namun gagal sinkron ke server: ${err?.message || 'Network error'}`,
    };
  }
}

export async function unsubscribeFromWebPushNotifications(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    localStorage.setItem(STORAGE_PUSH_MUTED_KEY, 'true');
  } catch {}

  if (!isWebPushSupported()) {
    return { success: true, message: 'Notifikasi dinonaktifkan.' };
  }

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => {});
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          supabaseConfig: getOptionalSupabaseConfig(),
        }),
      }).catch(() => {});
    }
    return {
      success: true,
      message: '🔕 Push Notifikasi dinonaktifkan untuk perangkat ini.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal menonaktifkan notifikasi.',
    };
  }
}

/**
 * Sinkronisasi diam-diam saat aplikasi dibuka jika pengguna sebelumnya sudah memberi izin notifikasi.
 */
export async function syncExistingWebPushSubscription(meta?: {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}): Promise<boolean> {
  if (!isWebPushSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    if (localStorage.getItem(STORAGE_PUSH_MUTED_KEY) === 'true') return false;
  } catch {}

  try {
    const reg = await getActiveServiceWorkerRegistration();
    if (!reg || !reg.pushManager) return false;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const vapidPublicKey = await fetchVapidPublicKey();
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }
    if (!sub) return false;

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: sub.toJSON(),
        userId:
          [meta?.userId, meta?.userEmail]
            .map((v) => String(v || '').trim())
            .filter((v, idx, arr) => v && v !== 'guest' && arr.indexOf(v) === idx)
            .join('|') || 'guest',
        userRole: meta?.userRole || 'buyer',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        supabaseConfig: getOptionalSupabaseConfig(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchWebPushServerStatus(): Promise<WebPushServerStatus | null> {
  try {
    const supabaseConfig = getOptionalSupabaseConfig();
    const res = supabaseConfig
      ? await fetch('/api/push/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supabaseConfig }),
        })
      : await fetch('/api/push/status');
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

export async function triggerPriorityWebPush(payload: {
  listingId: string;
  listingTitle: string;
  sellingPrice?: number;
  normalPrice?: number;
  discountPercentage?: number;
  location?: string;
  category?: string;
  imageUrl?: string;
  adLink?: string;
  isTest?: boolean;
}): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  totalSubscribers: number;
  supabaseConfigured?: boolean;
  supabaseTableReady?: boolean;
  errors?: string[];
  latestAlert?: PriorityWebAlertPayload;
  message?: string;
}> {
  const localAlert = emitLocalPriorityWebAlert({
    listingId: payload.listingId,
    listingTitle: payload.listingTitle,
    sellingPrice: payload.sellingPrice,
    discountPercentage: payload.discountPercentage,
    location: payload.location,
    image: payload.imageUrl,
    adLink: payload.adLink,
    isTest: payload.isTest,
  });

  try {
    const fallbackSubscription = await getCurrentBrowserPushSubscriptionJson();
    const res = await fetch('/api/push/send-priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        supabaseConfig: getOptionalSupabaseConfig(),
        fallbackSubscription: fallbackSubscription || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok && data?.success !== false,
      sent: Number(data?.sent || 0),
      failed: Number(data?.failed || 0),
      totalSubscribers: Number(data?.totalSubscribers || 0),
      supabaseConfigured: data?.supabaseConfigured,
      supabaseTableReady: data?.supabaseTableReady,
      errors: Array.isArray(data?.errors) ? data.errors : undefined,
      latestAlert: data?.latestAlert || localAlert,
      message: data?.message,
    };
  } catch (err: any) {
    return {
      success: false,
      sent: 0,
      failed: 1,
      totalSubscribers: 0,
      latestAlert: localAlert,
      message: err?.message || 'Gagal menghubungi server push.',
    };
  }
}

export async function triggerEventWebPush(payload: {
  eventType: WebPushEventType;
  listingId?: string;
  listingTitle?: string;
  recipientName?: string;
  recipientEmail?: string;
  targetUserId?: string;
  targetEmail?: string;
  sellerId?: string;
  addedQuota?: number;
  newTotalQuota?: number;
  takedownReason?: string;
  isEdit?: boolean;
  sellingPrice?: number;
  discountPercentage?: number;
  location?: string;
  imageUrl?: string;
  adLink?: string;
  includeFallback?: boolean;
  isTest?: boolean;
}): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  totalSubscribers: number;
  latestAlert?: PriorityWebAlertPayload;
  message?: string;
}> {
  const cleanId =
    payload.listingId || (payload.eventType === 'quota_activated' ? 'quota-activation' : 'bu-prioritas');
  const cleanTitle = payload.listingTitle || 'Pemberitahuan JualRugi.my.id';
  const localAlert = emitLocalPriorityWebAlert({
    eventType: payload.eventType,
    listingId: cleanId,
    listingTitle: cleanTitle,
    targetUserId: payload.targetUserId,
    targetEmail: payload.targetEmail || payload.recipientEmail,
    sellingPrice: payload.sellingPrice,
    discountPercentage: payload.discountPercentage,
    location: payload.location,
    image: payload.imageUrl,
    adLink: payload.adLink,
    isTest: payload.isTest,
  });

  try {
    const fallbackSubscription =
      payload.includeFallback === false ? null : await getCurrentBrowserPushSubscriptionJson();
    const res = await fetch('/api/push/send-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        listingId: cleanId,
        listingTitle: cleanTitle,
        supabaseConfig: getOptionalSupabaseConfig(),
        fallbackSubscription: fallbackSubscription || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok && data?.success !== false,
      sent: Number(data?.sent || 0),
      failed: Number(data?.failed || 0),
      totalSubscribers: Number(data?.totalSubscribers || 0),
      latestAlert: data?.latestAlert || localAlert,
      message: data?.message,
    };
  } catch (err: any) {
    return {
      success: false,
      sent: 0,
      failed: 1,
      totalSubscribers: 0,
      latestAlert: localAlert,
      message: err?.message || 'Gagal menghubungi server push.',
    };
  }
}
