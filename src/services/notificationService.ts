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
    badge: '/assets/aistudio/logo_icon_transparent.png',
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
