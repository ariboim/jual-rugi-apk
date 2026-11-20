/**
 * Universal Registered Users Engine - JualRugi.my.id
 * Kompatibel dengan Node.js (Express server.ts), Cloudflare Workers (worker.js),
 * dan Cloudflare Pages Functions (functions/api/*).
 */

export const USERS_TABLE_SQL = `-- Tabel users untuk Registrasi & Manajemen Pengguna Real-time
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  whatsapp TEXT,
  phone TEXT,
  role TEXT DEFAULT 'buyer',
  city TEXT DEFAULT 'Jakarta Selatan',
  listing_quota INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Izinkan publik daftar user" ON public.users;
CREATE POLICY "Izinkan publik daftar user"
ON public.users FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Izinkan user baca data profil" ON public.users;
CREATE POLICY "Izinkan user baca data profil"
ON public.users FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Izinkan user update profil" ON public.users;
CREATE POLICY "Izinkan user update profil"
ON public.users FOR UPDATE
TO anon, authenticated
USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;`;

export const DEFAULT_SEED_USERS = [
  {
    id: 'user-84091414',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@gmail.com',
    whatsapp: '6281284091414',
    phone: '0812-8409-1414',
    role: 'seller',
    registeredAt: '2026-11-10T15:36:51.873Z',
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
    listingQuota: 1,
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
    listingQuota: 1,
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
    listingQuota: 0,
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
    listingQuota: 1,
  },
];

function getMemoryUsersMap() {
  if (!globalThis.__JUALRUGI_USERS__) {
    globalThis.__JUALRUGI_USERS__ = new Map();
    for (const u of DEFAULT_SEED_USERS) {
      globalThis.__JUALRUGI_USERS__.set(u.email.toLowerCase(), { ...u });
    }
  }
  return globalThis.__JUALRUGI_USERS__;
}

// Mutex antrean agar operasi tulis paralel (misal POST /api/admin/users + /api/registration-webhook + /api/send-welcome-email)
// tidak pernah saling menimpa isi disk/memory.
let usersWriteChain = Promise.resolve();
function runWithUsersWriteLock(fn) {
  const next = usersWriteChain.then(fn, fn);
  usersWriteChain = next.catch(() => {});
  return next;
}

export function setRuntimeSupabaseConfig(url = '', anonKey = '') {
  const cleanUrl = String(url || '').trim().replace(/\/+$/, '');
  const cleanKey = String(anonKey || '').trim();
  if (
    cleanUrl.startsWith('http') &&
    !cleanUrl.includes('your-project-id') &&
    cleanKey.length > 20 &&
    !cleanKey.endsWith('...')
  ) {
    globalThis.__JUALRUGI_SB_CONFIG__ = { url: cleanUrl, anonKey: cleanKey };
    return true;
  }
  return false;
}

export function getRuntimeSupabaseConfig() {
  return globalThis.__JUALRUGI_SB_CONFIG__ || { url: '', anonKey: '' };
}

function generateUuidV4() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function cleanWhatsAppDigits(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  else if (digits.startsWith('8')) digits = '62' + digits;
  return digits;
}

export function parseValidTimestampMs(value) {
  if (!value) return 0;
  const ms = Date.parse(String(value));
  return Number.isFinite(ms) ? ms : 0;
}

export function normalizeUserRecord(raw, fallbackNowIso = null) {
  if (!raw || typeof raw !== 'object') return null;
  let rawEmail = String(raw.email || '').trim().toLowerCase();
  if ((!rawEmail || !rawEmail.includes('@')) && raw.id && (raw.name || raw.full_name || raw.fullName)) {
    rawEmail = `${String(raw.id).replace(/[^a-z0-9._-]/gi, '')}@member.jualrugi.my.id`;
  }
  if (!rawEmail || !rawEmail.includes('@')) return null;

  const rawWa = String(
    raw.whatsapp || raw.nomor_wa || raw.no_whatsapp || raw.phone || raw.phone_number || ''
  ).trim();
  const cleanWa = cleanWhatsAppDigits(rawWa);
  const rawDate = raw.registeredAt || raw.created_at || raw.createdAt || raw.updated_at || fallbackNowIso;
  const dateMs = parseValidTimestampMs(rawDate);
  const registeredAt = dateMs > 0 ? new Date(dateMs).toISOString() : new Date().toISOString();

  const quotaVal =
    typeof raw.listingQuota === 'number'
      ? raw.listingQuota
      : typeof raw.listing_quota === 'number'
      ? raw.listing_quota
      : undefined;

  return {
    id: String(raw.id || `user-${Date.now()}`),
    name: String(raw.name || raw.fullName || raw.full_name || raw.nama || raw.nama_user || 'Member JualRugi').trim(),
    email: rawEmail,
    whatsapp: cleanWa || rawWa,
    phone: String(raw.phone || raw.phone_number || cleanWa || rawWa).trim(),
    role: raw.role === 'seller' ? 'seller' : 'buyer',
    registeredAt,
    city: String(raw.city || 'Jakarta Selatan').trim(),
    status: raw.status === 'blocked' ? 'blocked' : 'active',
    count: typeof raw.count === 'number' ? raw.count : 0,
    ...(typeof quotaVal === 'number' ? { listingQuota: quotaVal } : {}),
  };
}

export function mergeUserEntries(existing, incoming) {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const existingMs = parseValidTimestampMs(existing.registeredAt);
  const incomingMs = parseValidTimestampMs(incoming.registeredAt);

  // Gunakan timestamp paling awal yang valid untuk pendaftar lama agar urutan riwayat tetap akurat,
  // kecuali salah satu belum punya timestamp valid.
  const resolvedRegisteredAt =
    existingMs > 0 && incomingMs > 0
      ? incomingMs >= existingMs
        ? incoming.registeredAt
        : existing.registeredAt
      : incomingMs > 0
      ? incoming.registeredAt
      : existing.registeredAt;

  return {
    ...existing,
    ...incoming,
    id:
      incoming.id && !String(incoming.id).startsWith('user-sb-')
        ? incoming.id
        : existing.id || incoming.id,
    name:
      incoming.name && incoming.name !== 'Member JualRugi'
        ? incoming.name
        : existing.name || incoming.name,
    whatsapp: incoming.whatsapp || existing.whatsapp || '',
    phone: incoming.phone || existing.phone || incoming.whatsapp || '',
    role: incoming.role || existing.role || 'buyer',
    city: incoming.city || existing.city || 'Jakarta Selatan',
    status: existing.status === 'blocked' || incoming.status === 'blocked' ? 'blocked' : 'active',
    registeredAt: resolvedRegisteredAt,
    count: Math.max(Number(existing.count || 0), Number(incoming.count || 0)),
    listingQuota:
      typeof incoming.listingQuota === 'number'
        ? incoming.listingQuota
        : typeof existing.listingQuota === 'number'
        ? existing.listingQuota
        : 1,
  };
}

/**
 * @param {any} [env]
 * @param {any} [clientConfig]
 * @param {any} [headers]
 */
export function resolveSupabaseUsersCredentials(env = {}, clientConfig = null, headers = null) {
  const headerUrl =
    headers && typeof headers.get === 'function' ? headers.get('x-supabase-url') : headers?.['x-supabase-url'];
  const headerKey =
    headers && typeof headers.get === 'function' ? headers.get('x-supabase-key') : headers?.['x-supabase-key'];
  const runtimeCfg = getRuntimeSupabaseConfig();

  const candidatesUrl = [
    env?.SUPABASE_URL,
    env?.VITE_SUPABASE_URL,
    clientConfig?.url,
    headerUrl,
    runtimeCfg?.url,
  ];
  const candidatesKey = [
    env?.SUPABASE_SERVICE_ROLE_KEY,
    env?.SUPABASE_ANON_KEY,
    env?.VITE_SUPABASE_ANON_KEY,
    clientConfig?.anonKey,
    headerKey,
    runtimeCfg?.anonKey,
  ];

  const isValidPair = (u, k) => {
    const cleanU = String(u || '').trim().replace(/\/+$/, '');
    const cleanK = String(k || '').trim();
    return (
      Boolean(cleanU && cleanK) &&
      cleanU.startsWith('http') &&
      !cleanU.includes('your-project-id') &&
      cleanK.length > 20 &&
      !cleanK.endsWith('...')
    );
  };

  let rawUrl = '';
  for (const c of candidatesUrl) {
    const s = String(c || '').trim().replace(/\/+$/, '');
    if (s.startsWith('http') && !s.includes('your-project-id')) {
      rawUrl = s;
      break;
    }
  }

  let rawKey = '';
  for (const c of candidatesKey) {
    const s = String(c || '').trim();
    if (s.length > 20 && !s.endsWith('...')) {
      rawKey = s;
      break;
    }
  }

  const valid = isValidPair(rawUrl, rawKey);
  if (valid && !runtimeCfg?.url) {
    setRuntimeSupabaseConfig(rawUrl, rawKey);
  }

  return { valid, url: rawUrl, key: rawKey };
}

function isUuidSyntaxError(msg = '') {
  return /invalid input syntax for type uuid|22P02/i.test(msg);
}

function isConflictOrMissingColumnError(msg = '') {
  return /no unique or exclusion constraint|42P10|column .* does not exist|Could not find the .* column|PGRST204|null value in column|23502/i.test(
    msg
  );
}

async function patchExistingRowByEmail(sb, tableName, email, payload) {
  const headers = {
    apikey: sb.key,
    Authorization: `Bearer ${sb.key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  const patchVariants = [
    (() => {
      const u = { ...payload };
      delete u.id;
      delete u.created_at;
      delete u.email;
      return u;
    })(),
    {
      name: payload.name,
      whatsapp: payload.whatsapp,
      phone: payload.phone,
    },
    {
      name: payload.name,
      whatsapp: payload.whatsapp,
    },
    {
      full_name: payload.name,
      phone: payload.whatsapp,
    },
  ];

  for (const variant of patchVariants) {
    try {
      const patchRes = await fetch(
        `${sb.url}/rest/v1/${tableName}?email=ilike.${encodeURIComponent(email)}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(variant),
        }
      );
      if (patchRes.ok) {
        const patched = await patchRes.json().catch(() => []);
        return { ok: true, row: Array.isArray(patched) && patched[0] ? patched[0] : payload, table: tableName };
      }
    } catch {}
  }
  return null;
}

async function persistRowToSupabaseTable(sb, tableName, payload, email) {
  const headers = {
    apikey: sb.key,
    Authorization: `Bearer ${sb.key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  // 1. Cek apakah user dengan email ini sudah ada (select=id,email saja agar kebal perbedaan kolom opsional)
  try {
    const checkRes = await fetch(
      `${sb.url}/rest/v1/${tableName}?select=id,email&email=ilike.${encodeURIComponent(email)}&limit=1`,
      {
        headers: {
          apikey: sb.key,
          Authorization: `Bearer ${sb.key}`,
          Accept: 'application/json',
        },
      }
    );
    if (checkRes.ok) {
      const existingRows = await checkRes.json().catch(() => []);
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        const patched = await patchExistingRowByEmail(sb, tableName, email, payload);
        if (patched?.ok) return patched;
        return { ok: true, row: existingRows[0], table: tableName };
      }
    } else if (checkRes.status === 404) {
      return { ok: false, error: `Table ${tableName} not found (404)` };
    }
  } catch (err) {
    return { ok: false, error: err?.message || 'Supabase check failed' };
  }

  // 2. Insert baru dengan beberapa varian payload bertingkat (skema text ID, auto UUID, explicit UUID, full_name, minimal)
  const uuidId = generateUuidV4();
  const variants = [
    payload,
    (() => {
      const copy = { ...payload };
      delete copy.id;
      return copy;
    })(),
    {
      ...payload,
      id: uuidId,
    },
    {
      name: payload.name,
      email: payload.email,
      password: payload.password || '',
      whatsapp: payload.whatsapp,
      phone: payload.phone,
      role: payload.role,
      city: payload.city,
      created_at: payload.created_at,
    },
    {
      name: payload.name,
      email: payload.email,
      whatsapp: payload.whatsapp,
      phone: payload.phone,
      role: payload.role,
      city: payload.city,
      created_at: payload.created_at,
    },
    {
      id: uuidId,
      name: payload.name,
      email: payload.email,
      whatsapp: payload.whatsapp,
      created_at: payload.created_at,
    },
    {
      name: payload.name,
      email: payload.email,
      whatsapp: payload.whatsapp,
      created_at: payload.created_at,
    },
    {
      name: payload.name,
      email: payload.email,
      whatsapp: payload.whatsapp,
    },
    {
      id: uuidId,
      full_name: payload.name,
      email: payload.email,
      phone: payload.whatsapp,
    },
    {
      name: payload.name,
      email: payload.email,
    },
  ];

  let lastErr = '';
  for (let i = 0; i < variants.length; i++) {
    const candidate = variants[i];
    try {
      const res = await fetch(`${sb.url}/rest/v1/${tableName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(candidate),
      });
      if (res.ok) {
        const inserted = await res.json().catch(() => []);
        return {
          ok: true,
          row: Array.isArray(inserted) && inserted[0] ? inserted[0] : candidate,
          table: tableName,
        };
      }
      const errBody = await res.text().catch(() => '');
      lastErr = `HTTP ${res.status}: ${errBody}`;

      // Jika duplicate key (409 / 23505), update saja baris yang sudah ada
      if (res.status === 409 || /duplicate key|23505/i.test(errBody)) {
        const patched = await patchExistingRowByEmail(sb, tableName, email, payload);
        if (patched?.ok) return patched;
        return { ok: true, row: candidate, table: tableName };
      }

      if (
        res.status === 400 ||
        isUuidSyntaxError(errBody) ||
        isConflictOrMissingColumnError(errBody)
      ) {
        continue;
      }
      if (res.status === 404 || res.status === 401 || res.status === 403) {
        break;
      }
    } catch (e) {
      lastErr = e?.message || 'Network error';
    }
  }

  return { ok: false, error: lastErr || `Gagal insert ke ${tableName}` };
}

/**
 * @param {any} [rawInput]
 * @param {any} [env]
 * @param {{ load?: () => any; save?: (list: any[]) => any } | null} [localStore]
 * @param {any} [clientConfig]
 * @param {any} [headers]
 * @returns {Promise<{ success: boolean; user?: any; error?: string; supabaseConfigured?: boolean; supabasePersisted?: boolean; tableUsed?: string | null; supabaseError?: any }>}
 */
export async function upsertRegisteredUser(
  rawInput = {},
  env = {},
  localStore = null,
  clientConfig = null,
  headers = null
) {
  return runWithUsersWriteLock(async () => {
    const nowIso = new Date().toISOString();
    const normalized = normalizeUserRecord(rawInput, nowIso);
    if (!normalized) {
      return { success: false, user: null, error: 'Email pendaftar wajib diisi dan valid.' };
    }

    const mem = getMemoryUsersMap();
    const existingMem = mem.get(normalized.email);
    const mergedUser = mergeUserEntries(existingMem, normalized);
    mem.set(mergedUser.email, mergedUser);

    if (localStore && typeof localStore.load === 'function' && typeof localStore.save === 'function') {
      try {
        const diskRows = await localStore.load();
        const map = new Map();
        if (Array.isArray(diskRows)) {
          for (const row of diskRows) {
            const n = normalizeUserRecord(row);
            if (n) map.set(n.email, n);
          }
        }
        // Gabungkan juga dari memori aktif agar tidak pernah ada data yang tertinggal
        for (const [k, v] of mem.entries()) {
          const n = normalizeUserRecord(v);
          if (n) {
            map.set(k, mergeUserEntries(map.get(k), n));
          }
        }
        const prev = map.get(mergedUser.email);
        const next = mergeUserEntries(prev, mergedUser);
        map.set(next.email, next);
        const sorted = Array.from(map.values()).sort(
          (a, b) => parseValidTimestampMs(b.registeredAt) - parseValidTimestampMs(a.registeredAt)
        );
        await localStore.save(sorted);
      } catch (e) {
        console.warn('[usersCore] localStore save warning:', e?.message);
      }
    }

    const sb = resolveSupabaseUsersCredentials(env, clientConfig || rawInput?.supabaseConfig, headers);
    let supabasePersisted = false;
    let tableUsed = null;
    let supabaseError = null;

    if (sb.valid) {
      const sqlPayload = {
        id: mergedUser.id,
        name: mergedUser.name,
        email: mergedUser.email,
        password: rawInput?.password ? String(rawInput.password) : '',
        whatsapp: mergedUser.whatsapp,
        phone: mergedUser.phone || mergedUser.whatsapp,
        role: mergedUser.role || 'buyer',
        city: mergedUser.city || 'Jakarta Selatan',
        listing_quota: typeof mergedUser.listingQuota === 'number' ? mergedUser.listingQuota : 1,
        created_at: mergedUser.registeredAt,
      };

      const resUsers = await persistRowToSupabaseTable(sb, 'users', sqlPayload, mergedUser.email);
      if (resUsers.ok) {
        supabasePersisted = true;
        tableUsed = 'users';
      } else {
        const resProfiles = await persistRowToSupabaseTable(sb, 'profiles', sqlPayload, mergedUser.email);
        if (resProfiles.ok) {
          supabasePersisted = true;
          tableUsed = 'profiles';
        } else {
          supabaseError = resUsers.error || resProfiles.error;
        }
      }
    }

    return {
      success: true,
      user: mergedUser,
      supabaseConfigured: sb.valid,
      supabasePersisted,
      tableUsed,
      ...(supabaseError ? { supabaseError } : {}),
    };
  });
}

/**
 * Menyinkronkan kumpulan user sekaligus (backfill aman tanpa menghapus data lama)
 * @param {any[]} [rawList]
 * @param {any} [env]
 * @param {{ load?: () => any; save?: (list: any[]) => any } | null} [localStore]
 * @param {any} [clientConfig]
 * @param {any} [headers]
 */
export async function upsertRegisteredUsersBatch(
  rawList = [],
  env = {},
  localStore = null,
  clientConfig = null,
  headers = null
) {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return { success: true, syncedCount: 0, supabasePersistedCount: 0 };
  }

  let syncedCount = 0;
  let supabasePersistedCount = 0;
  for (const item of rawList) {
    const res = await upsertRegisteredUser(item, env, localStore, clientConfig, headers);
    if (res.success) syncedCount++;
    if (res.supabasePersisted) supabasePersistedCount++;
  }
  return { success: true, syncedCount, supabasePersistedCount };
}

async function fetchSupabaseTableRows(sb, tableName) {
  try {
    const res = await fetch(
      `${sb.url}/rest/v1/${tableName}?select=*&order=created_at.desc&limit=1000`,
      {
        headers: {
          apikey: sb.key,
          Authorization: `Bearer ${sb.key}`,
          Accept: 'application/json',
        },
      }
    );
    if (res.ok) {
      const rows = await res.json().catch(() => []);
      return { ok: true, rows: Array.isArray(rows) ? rows : [] };
    }
    const errText = await res.text().catch(() => '');
    // Fallback jika tabel tidak memiliki kolom created_at
    if (res.status === 400) {
      const retry = await fetch(`${sb.url}/rest/v1/${tableName}?select=*&limit=1000`, {
        headers: {
          apikey: sb.key,
          Authorization: `Bearer ${sb.key}`,
          Accept: 'application/json',
        },
      });
      if (retry.ok) {
        const rows = await retry.json().catch(() => []);
        return { ok: true, rows: Array.isArray(rows) ? rows : [] };
      }
    }
    return { ok: false, rows: [], status: res.status, error: errText || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, rows: [], error: e?.message || 'Network error' };
  }
}

/**
 * @param {any} [env]
 * @param {{ load?: () => any; save?: (list: any[]) => any } | null} [localStore]
 * @param {any} [clientConfig]
 * @param {any} [headers]
 */
export async function listRegisteredUsers(
  env = {},
  localStore = null,
  clientConfig = null,
  headers = null
) {
  const combined = new Map();
  const mem = getMemoryUsersMap();

  for (const [k, v] of mem.entries()) {
    const n = normalizeUserRecord(v);
    if (n) combined.set(k, n);
  }

  let initialDiskCount = 0;
  if (localStore && typeof localStore.load === 'function') {
    try {
      const diskRows = await localStore.load();
      if (Array.isArray(diskRows)) {
        initialDiskCount = diskRows.length;
        for (const row of diskRows) {
          const n = normalizeUserRecord(row);
          if (n) {
            const merged = mergeUserEntries(combined.get(n.email), n);
            combined.set(n.email, merged);
            mem.set(n.email, merged);
          }
        }
      }
    } catch (_) {}
  }

  const sb = resolveSupabaseUsersCredentials(env, clientConfig, headers);
  let supabaseTableReady = false;
  let supabaseTableError = null;

  if (sb.valid) {
    const [usersRes, profilesRes] = await Promise.all([
      fetchSupabaseTableRows(sb, 'users'),
      fetchSupabaseTableRows(sb, 'profiles'),
    ]);

    if (usersRes.ok || profilesRes.ok) {
      supabaseTableReady = true;
    } else {
      supabaseTableError = usersRes.error || profilesRes.error || 'Tabel users belum siap';
    }

    const allSbRows = [...(profilesRes.rows || []), ...(usersRes.rows || [])];
    for (const row of allSbRows) {
      const n = normalizeUserRecord(row);
      if (n) {
        const merged = mergeUserEntries(combined.get(n.email), n);
        combined.set(n.email, merged);
        mem.set(n.email, merged);
      }
    }
  }

  const users = Array.from(combined.values()).sort(
    (a, b) => parseValidTimestampMs(b.registeredAt) - parseValidTimestampMs(a.registeredAt)
  );

  // Jika Supabase / memory memiliki data pengguna yang belum ada di disk, simpan permanen ke localStore
  if (
    localStore &&
    typeof localStore.save === 'function' &&
    users.length > initialDiskCount
  ) {
    runWithUsersWriteLock(async () => {
      try {
        await localStore.save(users);
      } catch (_) {}
    }).catch(() => {});
  }

  return {
    success: true,
    users,
    count: users.length,
    supabaseConfigured: sb.valid,
    supabaseTableReady,
    ...(supabaseTableError ? { supabaseTableError } : {}),
    syncedAt: new Date().toISOString(),
  };
}
