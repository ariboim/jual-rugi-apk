/**
 * Service untuk Push Notifikasi Browser & Simulasi Moderasi Iklan
 * Mendukung Web Push Notification (Desktop & Android PWA) serta fallback In-App Toast.
 */

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
    badge: '/logo_icon.png',
    tag: 'jualrugi-ad-moderation',
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

export async function subscribeToWebPushNotifications(meta?: {
  userId?: string;
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

  const permission = await requestBrowserNotificationPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      subscribed: false,
      message:
        permission === 'denied'
          ? 'Izin notifikasi diblokir di browser. Aktifkan melalui ikon gembok di address bar.'
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
        userId: meta?.userId || 'guest',
        userRole: meta?.userRole || 'buyer',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
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
        body: JSON.stringify({ endpoint }),
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
        userId: meta?.userId || 'guest',
        userRole: meta?.userRole || 'buyer',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchWebPushServerStatus(): Promise<WebPushServerStatus | null> {
  try {
    const res = await fetch('/api/push/status');
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
  message?: string;
}> {
  try {
    const res = await fetch('/api/push/send-priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok && data?.success !== false,
      sent: Number(data?.sent || 0),
      failed: Number(data?.failed || 0),
      totalSubscribers: Number(data?.totalSubscribers || 0),
      message: data?.message,
    };
  } catch (err: any) {
    return {
      success: false,
      sent: 0,
      failed: 1,
      totalSubscribers: 0,
      message: err?.message || 'Gagal menghubungi server push.',
    };
  }
}

