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
  const rawEmail = String(raw.email || '').trim().toLowerCase();
  if (!rawEmail || !rawEmail.includes('@')) return null;

  const rawWa = String(raw.whatsapp || raw.nomor_wa || raw.no_whatsapp || raw.phone || '').trim();
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
    name: String(raw.name || raw.fullName || raw.nama || raw.nama_user || 'Member JualRugi').trim(),
    email: rawEmail,
    whatsapp: cleanWa || rawWa,
    phone: String(raw.phone || cleanWa || rawWa).trim(),
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

  // Gunakan timestamp yang paling baru jika valid (pendaftar baru selalu paling atas)
  const resolvedRegisteredAt =
    incomingMs >= existingMs
      ? incoming.registeredAt
      : existing.registeredAt;

  return {
    ...existing,
    ...incoming,
    id: incoming.id && !incoming.id.startsWith('user-sb-') ? incoming.id : existing.id || incoming.id,
    name: incoming.name && incoming.name !== 'Member JualRugi' ? incoming.name : existing.name || incoming.name,
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
  const headerUrl = headers && typeof headers.get === 'function' ? headers.get('x-supabase-url') : headers?.['x-supabase-url'];
  const headerKey = headers && typeof headers.get === 'function' ? headers.get('x-supabase-key') : headers?.['x-supabase-key'];

  const rawUrl = String(
    env?.SUPABASE_URL ||
      env?.VITE_SUPABASE_URL ||
      clientConfig?.url ||
      headerUrl ||
      ''
  )
    .trim()
    .replace(/\/+$/, '');

  const rawKey = String(
    env?.SUPABASE_SERVICE_ROLE_KEY ||
      env?.SUPABASE_ANON_KEY ||
      env?.VITE_SUPABASE_ANON_KEY ||
      clientConfig?.anonKey ||
      headerKey ||
      ''
  ).trim();

  const valid =
    Boolean(rawUrl && rawKey) &&
    rawUrl.startsWith('http') &&
    !rawUrl.includes('your-project-id') &&
    rawKey.length > 20 &&
    !rawKey.endsWith('...');

  return { valid, url: rawUrl, key: rawKey };
}

function isUuidSyntaxError(msg = '') {
  return /invalid input syntax for type uuid|22P02/i.test(msg);
}

function isConflictOrMissingColumnError(msg = '') {
  return /no unique or exclusion constraint|42P10|column .* does not exist|Could not find the .* column|PGRST204/i.test(msg);
}

async function persistRowToSupabaseTable(sb, tableName, payload, email) {
  const headers = {
    apikey: sb.key,
    Authorization: `Bearer ${sb.key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  // 1. Cek apakah user dengan email ini sudah ada
  try {
    const checkRes = await fetch(
      `${sb.url}/rest/v1/${tableName}?select=id,email,created_at,listing_quota&email=eq.${encodeURIComponent(email)}&limit=1`,
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
        const updatePayload = { ...payload };
        delete updatePayload.id;
        delete updatePayload.created_at;
        const patchRes = await fetch(
          `${sb.url}/rest/v1/${tableName}?email=eq.${encodeURIComponent(email)}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updatePayload),
          }
        );
        if (patchRes.ok) {
          const patched = await patchRes.json().catch(() => []);
          return { ok: true, row: Array.isArray(patched) ? patched[0] : existingRows[0], table: tableName };
        }
      }
    } else if (checkRes.status === 404) {
      return { ok: false, error: `Table ${tableName} not found (404)` };
    }
  } catch (err) {
    return { ok: false, error: err?.message || 'Supabase check failed' };
  }

  // 2. Insert baru dengan beberapa varian payload bertingkat (jika ada perbedaan skema/kolom/UUID)
  const variants = [
    payload,
    (() => {
      const copy = { ...payload };
      delete copy.id;
      return copy;
    })(),
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
}

async function fetchSupabaseTableRows(sb, tableName) {
  try {
    const res = await fetch(
      `${sb.url}/rest/v1/${tableName}?select=*&order=created_at.desc&limit=500`,
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
    // Fallback jika tabel tidak memiliki kolom created_at
    if (res.status === 400) {
      const retry = await fetch(`${sb.url}/rest/v1/${tableName}?select=*&limit=500`, {
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
    return { ok: false, rows: [], status: res.status };
  } catch {
    return { ok: false, rows: [] };
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

  if (localStore && typeof localStore.load === 'function') {
    try {
      const diskRows = await localStore.load();
      if (Array.isArray(diskRows)) {
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

  if (sb.valid) {
    const [usersRes, profilesRes] = await Promise.all([
      fetchSupabaseTableRows(sb, 'users'),
      fetchSupabaseTableRows(sb, 'profiles'),
    ]);

    if (usersRes.ok || profilesRes.ok) {
      supabaseTableReady = true;
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

  return {
    success: true,
    users,
    count: users.length,
    supabaseConfigured: sb.valid,
    supabaseTableReady,
    syncedAt: new Date().toISOString(),
  };
}
