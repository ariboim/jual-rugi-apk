/**
 * Layanan Manajemen Pengguna (User Management Service) - JualRugi.my.id
 * Mengelola penyimpanan persisten pendaftar baru, sinkronisasi, dan ekspor data (CSV, XLS, PDF)
 * untuk kemudahan kampanye pemasaran via WhatsApp & Email.
 */

import { fetchAllUsersFromSupabase } from './supabase';

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  phone: string;
  role: 'buyer' | 'seller';
  registeredAt: string;
  city: string;
  status: 'active' | 'blocked';
  count?: number;
  listingQuota?: number;
  freeQuotaAvailableAt?: string;
  lastSoldAt?: string;
}

const STORAGE_KEY = 'jualrugi_registered_users';

// Data pendaftar bawaan / awal (Menyertakan user 6281284091414 & Boim Ganteng)
const DEFAULT_REGISTERED_USERS: RegisteredUser[] = [
  {
    id: 'user-84091414',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@gmail.com',
    whatsapp: '6281284091414',
    phone: '0812-8409-1414',
    role: 'seller',
    registeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    city: 'Jakarta Selatan',
    status: 'active',
    count: 1,
    listingQuota: 1,
  },
  {
    id: 'user-boim-ganteng',
    name: 'Boim Ganteng',
    email: 'boim.ganteng@gmail.com',
    whatsapp: '081298765432',
    phone: '0812-9876-5432',
    role: 'buyer',
    registeredAt: '2026-11-09T08:00:00.000Z',
    city: 'Jakarta Selatan',
    status: 'active',
    count: 0,
  },
  {
    id: 'buyer-rian',
    name: 'Rian Pratama',
    email: 'rian.pratama@gmail.com',
    whatsapp: '081299887766',
    phone: '0812-9988-7766',
    role: 'buyer',
    registeredAt: '2026-11-01T08:30:00.000Z',
    city: 'Jakarta Selatan',
    status: 'active',
    count: 2,
  },
  {
    id: 'seller-agus',
    name: 'Agus Setiawan',
    email: 'agus.setiawan@gmail.com',
    whatsapp: '081288991234',
    phone: '0812-8899-1234',
    role: 'seller',
    registeredAt: '2026-11-02T10:15:00.000Z',
    city: 'Jakarta Selatan',
    status: 'active',
    count: 2,
  },
  {
    id: 'seller-bambang',
    name: 'Bambang Riyadi',
    email: 'bambang.riyadi@gmail.com',
    whatsapp: '085712345678',
    phone: '0857-1234-5678',
    role: 'seller',
    registeredAt: '2026-11-03T14:20:00.000Z',
    city: 'Depok',
    status: 'active',
    count: 1,
  },
  {
    id: 'seller-dewi',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@gmail.com',
    whatsapp: '081323456789',
    phone: '0813-2345-6789',
    role: 'seller',
    registeredAt: '2026-11-04T09:40:00.000Z',
    city: 'Bekasi',
    status: 'active',
    count: 1,
  },
  {
    id: 'seller-hendra',
    name: 'Hendra Kurniawan',
    email: 'hendra.kurniawan@gmail.com',
    whatsapp: '082134567890',
    phone: '0821-3456-7890',
    role: 'seller',
    registeredAt: '2026-11-05T11:25:00.000Z',
    city: 'Tangerang',
    status: 'active',
    count: 1,
  },
  {
    id: 'seller-siti',
    name: 'Siti Rahmawati',
    email: 'siti.rahmawati@gmail.com',
    whatsapp: '081245678901',
    phone: '0812-4567-8901',
    role: 'seller',
    registeredAt: '2026-11-06T15:10:00.000Z',
    city: 'Jakarta Barat',
    status: 'active',
    count: 1,
  },
  {
    id: 'seller-budi',
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    whatsapp: '085678901234',
    phone: '0856-7890-1234',
    role: 'seller',
    registeredAt: '2026-11-07T13:50:00.000Z',
    city: 'Jakarta Pusat',
    status: 'active',
    count: 1,
  },
  {
    id: 'seller-maya',
    name: 'Maya Indah',
    email: 'maya.indah@gmail.com',
    whatsapp: '087890123456',
    phone: '0878-9012-3456',
    role: 'seller',
    registeredAt: '2026-11-08T16:05:00.000Z',
    city: 'Jakarta Timur',
    status: 'active',
    count: 1,
  },
  {
    id: 'seller-rudi',
    name: 'Rudi Hermawan',
    email: 'rudi.hermawan@gmail.com',
    whatsapp: '089601234567',
    phone: '0896-0123-4567',
    role: 'seller',
    registeredAt: '2026-11-08T18:45:00.000Z',
    city: 'Depok',
    status: 'active',
    count: 1,
  },
];

/**
 * Normalisasi nomor WhatsApp menjadi format numerik bersih
 */
export function cleanWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Format nomor WhatsApp untuk tautan chat langsung (wa.me/62...)
 */
export function getWhatsAppChatLink(phone: string, text: string = ''): string {
  let num = cleanWhatsAppNumber(phone);
  if (num.startsWith('0')) {
    num = '62' + num.slice(1);
  } else if (num.startsWith('8')) {
    num = '62' + num;
  }
  const enc = encodeURIComponent(text || 'Halo dari tim JualRugi.my.id! 🎉');
  return `https://wa.me/${num}?text=${enc}`;
}

/**
 * Mengambil nomor WhatsApp seller secara dinamis dari data produk/iklan
 */
export function getSellerWhatsAppNumber(listing: any): string {
  if (!listing) return '6281288991234';

  // 1. Cek langsung properti nomor telepon seller di objek listing
  let rawPhone =
    listing.seller_phone ||
    listing.sellerPhone ||
    listing.whatsapp ||
    listing.phone ||
    listing.seller?.phone ||
    listing.seller?.whatsapp ||
    listing.seller?.phoneMasked ||
    '';

  // 2. Jika phoneMasked masih mengandung mask 'XXXX' atau '*', cari di database pengguna tersimpan
  if (!rawPhone || rawPhone.includes('X') || rawPhone.includes('x') || rawPhone.includes('*')) {
    const sellerId = listing.user_id || listing.seller?.id;
    const sellerName = (listing.seller?.name || '').toLowerCase().trim();
    const storedUsers = getStoredUsers();
    const foundUser = storedUsers.find(
      (u) =>
        (sellerId && (u.id === sellerId || u.email.toLowerCase() === String(sellerId).toLowerCase())) ||
        (sellerName && u.name.toLowerCase() === sellerName)
    );
    if (foundUser && (foundUser.whatsapp || foundUser.phone)) {
      rawPhone = foundUser.whatsapp || foundUser.phone;
    }
  }

  // 3. Fallback map nomor WhatsApp aktif untuk seller default
  if (!rawPhone || rawPhone.includes('X') || rawPhone.includes('x') || rawPhone.includes('*')) {
    const fallbackSellerMap: Record<string, string> = {
      'seller-agus': '081288991234',
      'seller-bambang': '085712345678',
      'seller-dewi': '081323456789',
      'seller-hendra': '082134567890',
      'seller-siti': '081245678901',
      'seller-budi': '085678901234',
      'seller-maya': '087890123456',
      'seller-rudi': '089601234567',
      'buyer-rian': '081299887766',
      'user-boim-ganteng': '081298765432',
    };
    const sId = listing.seller?.id || listing.user_id || '';
    if (fallbackSellerMap[sId]) {
      rawPhone = fallbackSellerMap[sId];
    } else {
      rawPhone = '081288991234';
    }
  }

  // Normalisasi ke format 62xxx
  let clean = cleanWhatsAppNumber(rawPhone);
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean || '6281288991234';
}

/**
 * Membuat tautan dinamis wa.me ke seller dengan pesan otomatis:
 * "Halo kak, saya tertarik dengan produk *[nama_produk]* yang ada di JualRugi.my.id"
 */
export function buildSellerWhatsAppChatUrl(listing: any): string {
  const sellerPhone = getSellerWhatsAppNumber(listing);
  const productName = listing?.title || 'Produk JualRugi';
  const message = `Halo kak, saya tertarik dengan produk *${productName}* yang ada di JualRugi.my.id`;
  return `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;
}


/**
 * Mengambil seluruh data pengguna yang tersimpan di localStorage
 */
export function getStoredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_REGISTERED_USERS));
      return DEFAULT_REGISTERED_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_REGISTERED_USERS));
      return DEFAULT_REGISTERED_USERS;
    }

    // Pastikan user 6281284091414 dan Boim Ganteng selalu tersedia di daftar
    let updatedList = [...parsed];
    const hasPhoneUser = updatedList.some(
      (u: RegisteredUser) =>
        (u.whatsapp && u.whatsapp.includes('84091414')) ||
        (u.phone && u.phone.includes('84091414'))
    );
    if (!hasPhoneUser) {
      updatedList = [DEFAULT_REGISTERED_USERS[0], ...updatedList];
    }

    const hasBoim = updatedList.some(
      (u: RegisteredUser) =>
        (u.name && u.name.toLowerCase().includes('boim')) ||
        (u.email && u.email.toLowerCase().includes('boim'))
    );
    if (!hasBoim) {
      updatedList = [DEFAULT_REGISTERED_USERS[1], ...updatedList];
    }

    if (updatedList.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    }
    return updatedList;
  } catch (e) {
    console.error('[userService] Gagal membaca user storage:', e);
    return DEFAULT_REGISTERED_USERS;
  }
}

/**
 * Menyimpan pendaftar baru dari Form Registrasi ke penyimpanan persisten
 */
export function saveNewRegisteredUser(userData: {
  id?: string;
  name: string;
  email: string;
  whatsapp: string;
  role?: 'buyer' | 'seller';
  city?: string;
}): RegisteredUser {
  const currentList = getStoredUsers();

  const cleanEmail = userData.email.trim().toLowerCase();
  const cleanName = userData.name.trim();
  const cleanWa = cleanWhatsAppNumber(userData.whatsapp);
  const formattedPhone = userData.whatsapp.trim();
  const userId = userData.id || `user-${Date.now()}`;

  // Cek apakah sudah pernah terdaftar
  const existingIdx = currentList.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  const newUser: RegisteredUser = {
    id: existingIdx >= 0 ? currentList[existingIdx].id : userId,
    name: cleanName,
    email: cleanEmail,
    whatsapp: cleanWa || formattedPhone,
    phone: formattedPhone || cleanWa,
    role: userData.role || (existingIdx >= 0 ? currentList[existingIdx].role : 'buyer'),
    registeredAt: existingIdx >= 0 ? currentList[existingIdx].registeredAt : new Date().toISOString(),
    city: userData.city || 'Jakarta Selatan',
    status: existingIdx >= 0 ? currentList[existingIdx].status : 'active',
    count: existingIdx >= 0 ? currentList[existingIdx].count || 0 : 0,
  };

  let updatedList: RegisteredUser[];
  if (existingIdx >= 0) {
    updatedList = [...currentList];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...newUser };
  } else {
    // Taruh pendaftar baru di urutan teratas agar langsung kelihatan oleh admin
    updatedList = [newUser, ...currentList];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    localStorage.setItem(
      'jualrugi_current_user',
      JSON.stringify({
        id: newUser.id,
        name: newUser.name,
        role: newUser.role || 'buyer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        email: newUser.email,
        phone: newUser.whatsapp || newUser.phone,
        whatsapp: newUser.whatsapp || newUser.phone,
        city: newUser.city || 'Jakarta Selatan',
        freeListingUsed: false,
        listingQuota: newUser.listingQuota ?? 1,
        activeListingCount: 0,
        permissions: {
          locationGranted: false,
          cameraGalleryGranted: false,
        },
      })
    );
    localStorage.setItem('jualrugi_is_logged_in', 'true');
    localStorage.setItem('jualrugi_last_registered_email', cleanEmail);
  } catch (err) {
    console.error('[userService] Gagal menyimpan ke localStorage:', err);
  }

  // Notifikasi event ke komponen AdminDashboard yang sedang terbuka
  try {
    window.dispatchEvent(
      new CustomEvent('jualrugi_user_registered', {
        detail: newUser,
      })
    );
  } catch (evErr) {
    // Ignore event dispatch errors in environments without CustomEvent
  }

  // Kirimkan asynchronous sync ke server
  try {
    fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).catch(() => {});
  } catch {
    // Silent fallback
  }

  return newUser;
}

/**
 * Update kuota posting iklan pengguna secara manual (oleh Admin pada Tab Manajemen Pengguna)
 * Mendukung penambahan +1, +5, atau +10 kuota
 */
export function updateStoredUserQuota(
  userId: string,
  addedQuota: number
): { success: boolean; newQuota: number; user?: RegisteredUser } {
  try {
    const list = getStoredUsers();
    let targetUser: RegisteredUser | undefined;
    let computedQuota = addedQuota;

    const updated = list.map((u) => {
      const match =
        u.id === userId ||
        u.email.toLowerCase() === userId.toLowerCase() ||
        (u.name && u.name.toLowerCase() === userId.toLowerCase());

      if (match) {
        const cur = typeof u.listingQuota === 'number' ? u.listingQuota : 1;
        computedQuota = Math.max(0, cur + addedQuota);
        targetUser = {
          ...u,
          listingQuota: computedQuota,
          // Jika admin menambah kuota, reset periode cooldown jika kuota sekarang > 0
          freeQuotaAvailableAt: computedQuota > 0 ? undefined : u.freeQuotaAvailableAt,
        };
        return targetUser;
      }
      return u;
    });

    if (targetUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { success: true, newQuota: computedQuota, user: targetUser };
    }

    return { success: false, newQuota: addedQuota };
  } catch (err) {
    console.error('[userService] Gagal menambah kuota pengguna:', err);
    return { success: false, newQuota: addedQuota };
  }
}

/**
 * Mengambil kuota aktif pengguna tersimpan
 */
export function getUserQuota(userId: string): number {
  try {
    const list = getStoredUsers();
    const found = list.find(
      (u) =>
        u.id === userId ||
        u.email.toLowerCase() === userId.toLowerCase() ||
        (u.name && u.name.toLowerCase() === userId.toLowerCase())
    );
    if (found && typeof found.listingQuota === 'number') {
      return found.listingQuota;
    }
    return 1; // Default bonus 1 kuota
  } catch {
    return 1;
  }
}

/**
 * Mengambil profil user yang sedang aktif tersimpan atau pendaftar terbaru yang bukan dummy seed
 */
export function getActiveOrLatestUser(): RegisteredUser | null {
  try {
    const rawSaved = localStorage.getItem('jualrugi_current_user');
    if (rawSaved) {
      const parsed = JSON.parse(rawSaved);
      if (parsed && parsed.name && parsed.name !== 'Rian Pratama' && parsed.id !== 'guest') {
        return {
          id: parsed.id,
          name: parsed.name,
          email: parsed.email,
          whatsapp: parsed.whatsapp || parsed.phone || '',
          phone: parsed.phone || parsed.whatsapp || '',
          role: parsed.role || 'buyer',
          registeredAt: parsed.registeredAt || new Date().toISOString(),
          city: parsed.city || 'Jakarta Selatan',
          status: 'active',
          listingQuota: parsed.listingQuota ?? 1,
        };
      }
    }
  } catch {}

  const list = getStoredUsers();
  // Cari user riil yang didaftarkan (bukan dummy seed bawaan sistem)
  const realUser = list.find(
    (u) =>
      u.name &&
      u.name !== 'Rian Pratama' &&
      u.name !== 'Agus Setiawan' &&
      u.name !== 'Bambang Riyadi' &&
      u.name !== 'Dewi Lestari' &&
      u.name !== 'Hendra Kurniawan' &&
      u.name !== 'Siti Rahmawati' &&
      u.name !== 'Budi Santoso' &&
      u.name !== 'Maya Indah' &&
      u.name !== 'Rudi Hermawan' &&
      u.name !== 'Ahmad Fauzi' &&
      u.name !== 'Boim Ganteng' &&
      !u.id.startsWith('seed-')
  );

  return realUser || null;
}

/**
 * Mencari data pengguna berdasarkan email, nomor WhatsApp/telepon, atau nama
 */
export function findStoredUser(identifier: string): RegisteredUser | null {
  if (!identifier) return null;
  const cleanIdent = identifier.trim().toLowerCase();
  const numIdent = identifier.replace(/\D/g, '');
  const list = getStoredUsers();

  return (
    list.find(
      (u) =>
        u.email.toLowerCase() === cleanIdent ||
        (cleanIdent.length >= 3 && u.name.toLowerCase() === cleanIdent) ||
        (cleanIdent.length >= 4 && u.name.toLowerCase().includes(cleanIdent)) ||
        (numIdent.length >= 6 &&
          ((u.whatsapp && u.whatsapp.replace(/\D/g, '').endsWith(numIdent.slice(-8))) ||
           (u.phone && u.phone.replace(/\D/g, '').endsWith(numIdent.slice(-8)))))
    ) || null
  );
}

/**
 * Sinkronisasi data pengguna dari server backend dan Supabase database
 * Menggabungkan seluruh sumber pendaftaran (localStorage, Server API, Supabase DB)
 */
export async function syncUsersFromServer(): Promise<RegisteredUser[]> {
  const localList = getStoredUsers();
  const map = new Map<string, RegisteredUser>();

  // 1. Masukkan data lokal terlebih dahulu
  localList.forEach((u) => {
    if (u.email) map.set(u.email.toLowerCase().trim(), u);
  });

  // 2. Ambil dari Supabase DB (Tabel users / profiles)
  try {
    const sbUsers = await fetchAllUsersFromSupabase();
    if (Array.isArray(sbUsers) && sbUsers.length > 0) {
      sbUsers.forEach((row: any) => {
        const emailKey = (row.email || '').toLowerCase().trim();
        if (emailKey) {
          const existing = map.get(emailKey);
          const rawWa = (row.whatsapp || row.phone || '').trim();
          const cleanWa = cleanWhatsAppNumber(rawWa);
          map.set(emailKey, {
            id: row.id || existing?.id || `user-sb-${Date.now()}`,
            name: row.name || existing?.name || 'Member JualRugi',
            email: emailKey,
            whatsapp: cleanWa || existing?.whatsapp || rawWa,
            phone: rawWa || existing?.phone || cleanWa,
            role: (row.role as any) || existing?.role || 'buyer',
            registeredAt: row.created_at || existing?.registeredAt || new Date().toISOString(),
            city: row.city || existing?.city || 'Jakarta Selatan',
            status: existing?.status || 'active',
            count: existing?.count || 0,
          });
        }
      });
    }
  } catch (sbErr) {
    console.warn('[userService] Sinkronisasi Supabase DB:', sbErr);
  }

  // 3. Ambil dari Server Endpoint (/api/admin/users)
  try {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.users) && data.users.length > 0) {
        data.users.forEach((u: RegisteredUser) => {
          const key = (u.email || '').toLowerCase().trim();
          if (key) {
            const existing = map.get(key);
            map.set(key, { ...existing, ...u });
          }
        });
      }
    }
  } catch (e) {
    // Silent fallback
  }

  // 4. Pastikan Boim Ganteng tetap ada
  const hasBoim = Array.from(map.values()).some(
    (u) =>
      (u.name && u.name.toLowerCase().includes('boim')) ||
      (u.email && u.email.toLowerCase().includes('boim'))
  );
  if (!hasBoim) {
    const boim = DEFAULT_REGISTERED_USERS[0];
    map.set(boim.email.toLowerCase(), boim);
  }

  const merged = Array.from(map.values());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn('[userService] Gagal update localStorage:', err);
  }

  return merged;
}


/**
 * Helper Download File di Browser
 */
function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Format Tanggal Indonesia
 */
export function formatIndoDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Ekspor Data Pengguna ke CSV (Kompatibel Microsoft Excel / Google Sheets)
 */
export function exportUsersToCSV(users: RegisteredUser[]) {
  const headers = [
    'ID Pengguna',
    'Nama Lengkap',
    'Alamat Email',
    'Nomor WhatsApp',
    'Role Akun',
    'Kota / Lokasi',
    'Tanggal Pendaftaran',
    'Status Akun',
  ];

  const rows = users.map((u) => [
    `"${(u.id || '').replace(/"/g, '""')}"`,
    `"${(u.name || '').replace(/"/g, '""')}"`,
    `"${(u.email || '').replace(/"/g, '""')}"`,
    `"${(u.whatsapp || u.phone || '').replace(/"/g, '""')}"`,
    `"${(u.role || 'buyer').replace(/"/g, '""')}"`,
    `"${(u.city || 'Jakarta').replace(/"/g, '""')}"`,
    `"${formatIndoDate(u.registeredAt)}"`,
    `"${u.status === 'blocked' ? 'Diblokir' : 'Aktif'}"`,
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `Data_Pengguna_JualRugi_${new Date().toISOString().slice(0, 10)}.csv`;
  triggerBrowserDownload(blob, filename);
}

/**
 * Ekspor Data Pengguna ke File Excel (.XLS)
 * Menggunakan format XML/HTML dengan deklarasi mso-number-format agar angka WhatsApp 08... tidak terpotong
 */
export function exportUsersToXLS(users: RegisteredUser[]) {
  const dateFormatted = formatIndoDate(new Date().toISOString());

  const tableRows = users
    .map(
      (u, idx) => `
    <tr>
      <td style="text-align:center;">${idx + 1}</td>
      <td style="mso-number-format:'\\@';">${u.id || '-'}</td>
      <td style="font-weight:bold;">${u.name || '-'}</td>
      <td>${u.email || '-'}</td>
      <td style="mso-number-format:'\\@'; font-weight:bold; color:#0284c7;">${u.whatsapp || u.phone || '-'}</td>
      <td style="text-transform:capitalize;">${u.role || 'buyer'}</td>
      <td>${u.city || '-'}</td>
      <td>${formatIndoDate(u.registeredAt)}</td>
      <td style="text-align:center; font-weight:bold; color:${u.status === 'blocked' ? '#e11d48' : '#059669'};">
        ${u.status === 'blocked' ? 'Diblokir' : 'Aktif'}
      </td>
    </tr>`
    )
    .join('');

  const xlsTemplate = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Data Pengguna JualRugi</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11pt; }
      th { background-color: #0284c7; color: #ffffff; padding: 10px 8px; border: 1px solid #0369a1; text-align: left; }
      td { padding: 8px; border: 1px solid #cbd5e1; }
      .header-title { font-size: 16pt; font-weight: bold; color: #0f172a; margin-bottom: 4px; }
      .header-subtitle { font-size: 10pt; color: #64748b; margin-bottom: 12px; }
    </style>
  </head>
  <body>
    <div class="header-title">JUALRUGI.MY.ID - DATABASE PENGGUNA TERDAFTAR</div>
    <div class="header-subtitle">Dibuat otomatis pada: ${dateFormatted} | Total: ${users.length} Pengguna</div>
    <br/>
    <table>
      <thead>
        <tr>
          <th>No</th>
          <th>ID Pengguna</th>
          <th>Nama Lengkap</th>
          <th>Alamat Email</th>
          <th>Nomor WhatsApp</th>
          <th>Role</th>
          <th>Kota</th>
          <th>Tanggal Daftar</th>
          <th>Status Akun</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob([xlsTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const filename = `Data_Pengguna_JualRugi_${new Date().toISOString().slice(0, 10)}.xls`;
  triggerBrowserDownload(blob, filename);
}

/**
 * Ekspor / Cetak Data Pengguna ke PDF (Tampilan Bersih & Siap Print / Save as PDF)
 */
export function exportUsersToPDF(users: RegisteredUser[]) {
  const dateFormatted = formatIndoDate(new Date().toISOString());

  const activeCount = users.filter((u) => u.status !== 'blocked').length;
  const blockedCount = users.filter((u) => u.status === 'blocked').length;

  const rowsHtml = users
    .map(
      (u, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
      <td style="padding: 8px 6px; text-align: center; color: #64748b; font-size: 11px;">${idx + 1}</td>
      <td style="padding: 8px 6px; font-family: monospace; font-size: 11px; font-weight: bold; color: #0369a1;">${u.id || '-'}</td>
      <td style="padding: 8px 6px; font-weight: 700; color: #0f172a; font-size: 12px;">${u.name || '-'}</td>
      <td style="padding: 8px 6px; color: #334155; font-size: 11px;">${u.email || '-'}</td>
      <td style="padding: 8px 6px; font-family: monospace; font-weight: 700; color: #0284c7; font-size: 12px;">${u.whatsapp || u.phone || '-'}</td>
      <td style="padding: 8px 6px; color: #64748b; font-size: 11px;">${formatIndoDate(u.registeredAt)}</td>
      <td style="padding: 8px 6px; text-align: center;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; ${
          u.status === 'blocked'
            ? 'background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3;'
            : 'background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;'
        }">
          ${u.status === 'blocked' ? 'Diblokir' : 'Aktif'}
        </span>
      </td>
    </tr>`
    )
    .join('');

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Jendela cetak terblokir oleh browser. Harap izinkan pop-up untuk mencetak PDF.');
    return;
  }

  printWindow.document.write(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Data_Pengguna_JualRugi_${new Date().toISOString().slice(0, 10)}</title>
      <meta charset="utf-8"/>
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 24px; padding: 0; }
        @media print {
          body { margin: 12px; }
          .no-print { display: none !important; }
        }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #0f172a; color: white; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 6px; text-align: left; }
        .badge-kpi { padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 12px;">
        <div style="font-weight: bold; color: #166534; font-size: 13px;">
          ✓ Dokumen Siap Dicetak atau Disimpan sebagai PDF via menu Cetak Browser.
        </div>
        <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer;">
          🖨️ Cetak / Simpan PDF
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px;">
        <div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #e11d48; letter-spacing: -0.5px;">
            jual<span style="color: #0f172a;">rugi</span><span style="color: #0284c7; font-size: 13px;">.my.id</span>
          </h1>
          <h2 style="margin: 4px 0 0 0; font-size: 14px; font-weight: 800; color: #1e293b;">
            LAPORAN DATA PENGGUNA TERDAFTAR (MARKETING & AUDIT)
          </h2>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
            Ekspor Resmi Panel Kontrol Admin • Dicetak pada: ${dateFormatted}
          </p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px;">
        <div class="badge-kpi">
          <div style="font-size: 10px; font-weight: 800; color: #64748b;">TOTAL PENGGUNA</div>
          <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 2px;">${users.length}</div>
        </div>
        <div class="badge-kpi">
          <div style="font-size: 10px; font-weight: 800; color: #059669;">AKUN AKTIF</div>
          <div style="font-size: 18px; font-weight: 900; color: #059669; margin-top: 2px;">${activeCount}</div>
        </div>
        <div class="badge-kpi">
          <div style="font-size: 10px; font-weight: 800; color: #e11d48;">AKUN DIBLOKIR</div>
          <div style="font-size: 18px; font-weight: 900; color: #e11d48; margin-top: 2px;">${blockedCount}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: center; width: 36px;">No</th>
            <th style="width: 110px;">ID Pengguna</th>
            <th>Nama Lengkap</th>
            <th>Alamat Email</th>
            <th style="width: 130px;">Nomor WhatsApp</th>
            <th style="width: 120px;">Tgl Daftar</th>
            <th style="text-align: center; width: 70px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
        <span>JualRugi.my.id - Pasar Butuh Uang Diskon Ekstrim</span>
        <span>Dokumen Rahasia Internal Marketing • Happy shopping!</span>
      </div>
    </body>
  </html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // Ignore print trigger error
    }
  }, 400);
}
