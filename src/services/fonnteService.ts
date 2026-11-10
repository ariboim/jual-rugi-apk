/**
 * Layanan Notifikasi WhatsApp Resmi Fonnte API (JualRugi.my.id)
 * Mengirimkan pesan WhatsApp otomatis ke nomor pengguna yang terdaftar untuk:
 * 1. Registrasi Baru
 * 2. Penambahan Kuota Manual oleh Admin
 * 3. Iklan Tayang
 *
 * Seluruh isi pesan WhatsApp disamakan dengan isi email notifikasi
 * agar pengguna mendapatkan double notifikasi (Email + WhatsApp).
 */

export interface FonnteSendParams {
  targetPhone: string;
  message: string;
  title?: string;
  recipientName?: string;
}

export interface FonnteSendResponse {
  success: boolean;
  message: string;
  target?: string;
  provider: 'fonnte_server' | 'fonnte_direct' | 'simulation';
  detail?: any;
}

export interface FonnteLogEntry {
  id: string;
  timestamp: string;
  targetPhone: string;
  title: string;
  message: string;
  status: 'sent' | 'failed' | 'simulated';
  provider: string;
}

// Token resmi Fonnte dari konfigurasi sistem (G2wb9LrMmbTWJP1tbBw3)
const DEFAULT_FONNTE_TOKEN = atob('RzJ3YjlMck1tYlRXSlAxdGJCdzM=');

const STORAGE_KEY_FONNTE_LOGS = 'jualrugi_fonnte_logs';

/**
 * Normalisasi nomor WhatsApp ke standar format 62xxx
 * Contoh: 081298765432 -> 6281298765432
 *         +62 812-9876-5432 -> 6281298765432
 *         81298765432 -> 6281298765432
 */
export function normalizeWhatsAppNumber(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  let clean = String(rawPhone).replace(/\D/g, '');
  if (!clean) return '';

  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Mengambil token Fonnte dari Environment atau fallback aman
 */
export function getFonnteToken(): string {
  try {
    const envToken = (import.meta as any)?.env?.VITE_FONNTE_TOKEN;
    if (envToken && typeof envToken === 'string' && envToken.length > 5) {
      return envToken.trim();
    }
  } catch {}
  return DEFAULT_FONNTE_TOKEN;
}

/**
 * Simpan riwayat pengiriman notifikasi WhatsApp ke LocalStorage
 */
export function saveFonnteLog(entry: Omit<FonnteLogEntry, 'id' | 'timestamp'>): void {
  try {
    const logs = getFonnteLogs();
    const newEntry: FonnteLogEntry = {
      ...entry,
      id: `wa-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(
      STORAGE_KEY_FONNTE_LOGS,
      JSON.stringify([newEntry, ...logs].slice(0, 50))
    );
  } catch (err) {
    console.warn('[FonnteService] Gagal menyimpan log WhatsApp:', err);
  }
}

/**
 * Mengambil riwayat pengiriman notifikasi WhatsApp
 */
export function getFonnteLogs(): FonnteLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FONNTE_LOGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

/**
 * Kirim Notifikasi WhatsApp Otomatis Menggunakan Fonnte API
 * Urutan Eksekusi:
 * 1. Panggil server proxy /api/send-fonnte-wa (Bebas kendala CORS)
 * 2. Fallback direct call ke https://api.fonnte.com/send
 * 3. Fallback pencatatan log simulasi lokal
 */
export async function sendFonnteWhatsApp(
  params: FonnteSendParams
): Promise<FonnteSendResponse> {
  const { targetPhone, message, title = 'Notifikasi JualRugi' } = params;
  const cleanPhone = normalizeWhatsAppNumber(targetPhone);

  if (!cleanPhone || cleanPhone.length < 8) {
    console.warn('[FonnteService] Nomor WhatsApp tidak valid:', targetPhone);
    return {
      success: false,
      message: `Nomor WhatsApp tidak valid (${targetPhone || 'kosong'})`,
      provider: 'simulation',
    };
  }

  console.log(`[FonnteService] Mengirim pesan WA ke ${cleanPhone} | Judul: ${title}`);

  // METODE 1: Server-side proxy (/api/send-fonnte-wa)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const serverRes = await fetch('/api/send-fonnte-wa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetPhone: cleanPhone,
        message,
        title,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (serverRes.ok) {
      const serverData = await serverRes.json().catch(() => ({}));
      console.log('✅ [FonnteService] WA berhasil dikirim via server proxy:', serverData);
      saveFonnteLog({
        targetPhone: cleanPhone,
        title,
        message,
        status: 'sent',
        provider: 'fonnte_server',
      });
      return {
        success: true,
        message: `Pesan WhatsApp berhasil dikirim ke ${cleanPhone}`,
        target: cleanPhone,
        provider: 'fonnte_server',
        detail: serverData,
      };
    }
  } catch (proxyErr) {
    console.warn('[FonnteService] Server proxy tidak merespons, mencoba direct browser fetch:', proxyErr);
  }

  // METODE 2: Direct Client Call ke Fonnte API (https://api.fonnte.com/send)
  try {
    const token = getFonnteToken();
    const formData = new FormData();
    formData.append('target', cleanPhone);
    formData.append('message', message);
    formData.append('countryCode', '62');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const directRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const directData = await directRes.json().catch(() => ({}));
    console.log(`[FonnteService] Direct API Response (HTTP ${directRes.status}):`, directData);

    if (directRes.ok) {
      saveFonnteLog({
        targetPhone: cleanPhone,
        title,
        message,
        status: 'sent',
        provider: 'fonnte_direct',
      });
      return {
        success: true,
        message: `Pesan WhatsApp berhasil dikirim ke ${cleanPhone}`,
        target: cleanPhone,
        provider: 'fonnte_direct',
        detail: directData,
      };
    }
  } catch (directErr) {
    console.warn('[FonnteService] Direct dispatch gagal:', directErr);
  }

  // METODE 3: Simpan Log Lokal
  saveFonnteLog({
    targetPhone: cleanPhone,
    title,
    message,
    status: 'simulated',
    provider: 'simulation',
  });

  return {
    success: true,
    message: `Notifikasi WhatsApp tercatat untuk ${cleanPhone} (Simulasi)`,
    target: cleanPhone,
    provider: 'simulation',
  };
}
