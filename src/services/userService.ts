/**
 * Layanan Manajemen Pengguna (User Management Service) - JualRugi.my.id
 * Mengelola penyimpanan persisten pendaftar baru, sinkronisasi, dan ekspor data (CSV, XLS, PDF)
 * untuk kemudahan kampanye pemasaran via WhatsApp & Email.
 */

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
}

const STORAGE_KEY = 'jualrugi_registered_users';

// Data pendaftar bawaan / awal
const DEFAULT_REGISTERED_USERS: RegisteredUser[] = [
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
    return parsed;
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
 * Sinkronisasi data pengguna dari server backend jika tersedia
 */
export async function syncUsersFromServer(): Promise<RegisteredUser[]> {
  try {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.users) && data.users.length > 0) {
        const localList = getStoredUsers();
        const map = new Map<string, RegisteredUser>();

        // Masukkan lokal terlebih dahulu
        localList.forEach((u) => map.set(u.email.toLowerCase(), u));

        // Gabungkan dengan data server
        data.users.forEach((u: RegisteredUser) => {
          const key = (u.email || '').toLowerCase();
          if (key) {
            const existing = map.get(key);
            map.set(key, { ...existing, ...u });
          }
        });

        const merged = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    // Fallback lokal
  }
  return getStoredUsers();
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
