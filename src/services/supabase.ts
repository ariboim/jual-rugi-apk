import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Listing, Category } from '../types';

let cachedClient: SupabaseClient | null = null;

/**
 * Mendapatkan konfigurasi URL dan Anon Key dari env atau localStorage
 */
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  let url = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  let anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  try {
    const savedUrl = localStorage.getItem('jualrugi_supabase_url');
    const savedKey = localStorage.getItem('jualrugi_supabase_anon_key');
    if (savedUrl && savedUrl.trim()) url = savedUrl.trim();
    if (savedKey && savedKey.trim()) anonKey = savedKey.trim();
  } catch (e) {
    console.error('Gagal membaca localStorage Supabase:', e);
  }

  return { url, anonKey };
}

/**
 * Mengecek apakah Supabase sudah memiliki kredensial
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 10);
}

/**
 * Inisialisasi atau ambil instance client Supabase
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey || !url.startsWith('http') || anonKey.length < 10) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(url, anonKey, {
        auth: {
          persistSession: false,
        },
      });
    } catch (e) {
      console.error('Inisialisasi Supabase client gagal:', e);
      return null;
    }
  }

  return cachedClient;
}

/**
 * Simpan konfigurasi baru (URL & Anon Key)
 */
export function saveSupabaseCredentials(url: string, anonKey: string) {
  try {
    localStorage.setItem('jualrugi_supabase_url', url.trim());
    localStorage.setItem('jualrugi_supabase_anon_key', anonKey.trim());
    cachedClient = null; // Reset cache agar client baru dibuat
  } catch (e) {
    console.error(e);
  }
}

/**
 * Menguji koneksi ke Supabase dan ketersediaan tabel 'listings'
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Kredensial Supabase URL atau Anon Key belum lengkap.',
    };
  }

  try {
    const { count, error } = await client
      .from('listings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        message: `Koneksi gagal: ${error.message} (Pastikan tabel 'listings' sudah dibuat di Supabase).`,
      };
    }

    return {
      success: true,
      message: `Berhasil terhubung ke Supabase! Ditemukan ${count ?? 0} iklan di database.`,
      count: count ?? 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error jaringan: ${err.message || 'Tidak dapat menghubungi server Supabase.'}`,
    };
  }
}

/**
 * Konversi baris data dari Supabase ke format Listing aplikasi JualRugi.my.id
 */
function mapRowToListing(row: any): Listing {
  const sellingPrice = Number(row.price || row.selling_price || 0);
  const normalPrice = Number(
    row.normal_price || Math.round(sellingPrice > 0 ? sellingPrice * 1.45 : 1000000)
  );
  const discountPercentage =
    normalPrice > sellingPrice
      ? Math.round(((normalPrice - sellingPrice) / normalPrice) * 100)
      : 30;

  return {
    id: String(row.id),
    title: row.title || 'Barang BU Dijual Cepat',
    category: (row.category as Category) || 'Smartphone & Gadget',
    normalPrice,
    sellingPrice,
    discountPercentage,
    location: row.location || 'Jakarta Selatan',
    condition: row.condition || 'Bekas Terawat',
    urgentReason: row.description || row.urgent_reason || 'Butuh uang mendesak hari ini',
    imageUrl:
      row.image_url ||
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
    isSuperBU: Boolean(row.is_priority || row.is_super_bu),
    createdAt: row.created_at || new Date().toISOString(),
    status: (row.status as any) || 'active',
    expiresAt: row.expires_at || new Date(new Date(row.created_at || Date.now()).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    soldAt: row.sold_at || undefined,
    user_id: row.user_id || row.seller_email || undefined,
    seller: {
      id: row.seller_email || 'seller-sb',
      name: row.seller_name || 'Penjual Terverifikasi',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      location: row.location || 'Jakarta Selatan',
      codVerified: true,
      rating: 4.9,
      dealsCompleted: 15,
      joinedDate: 'Member Terverifikasi',
      phoneMasked: row.seller_phone || '0812-****-****',
    },
    aiVerified: true,
    aiVerificationReason: 'Terverifikasi sistem pasar Butuh Uang',
    views: 89,
    savedCount: 24,
  };
}

/**
 * Konversi objek Listing aplikasi ke baris tabel Supabase
 */
function mapListingToRow(listing: Listing, userEmail?: string, userPhone?: string) {
  const createdAt = listing.createdAt || new Date().toISOString();
  const expiresAt =
    listing.expiresAt ||
    new Date(new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: listing.id,
    title: listing.title,
    price: listing.sellingPrice,
    normal_price: listing.normalPrice,
    description: listing.urgentReason || 'Butuh uang mendesak untuk kebutuhan cepat',
    category: listing.category,
    location: listing.location,
    condition: listing.condition,
    urgent_reason: listing.urgentReason,
    image_url: listing.imageUrl,
    seller_name: listing.seller?.name || 'Member JualRugi',
    seller_phone: userPhone || listing.seller?.phoneMasked || '0812-9988-7766',
    seller_email: userEmail || 'member@jualrugi.my.id',
    user_id: userEmail || listing.seller?.id || listing.user_id || null,
    is_priority: Boolean(listing.isSuperBU),
    status: listing.status || 'active',
    expires_at: expiresAt,
    sold_at: listing.soldAt || null,
    created_at: createdAt,
  };
}

/**
 * Mengambil seluruh data iklan dari tabel 'listings' Supabase
 */
export async function fetchListingsFromSupabase(): Promise<Listing[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Gagal membaca data dari Supabase:', error.message);
      return null;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      return data.map(mapRowToListing);
    }

    return [];
  } catch (err) {
    console.error('Error saat fetch listings dari Supabase:', err);
    return null;
  }
}

/**
 * Mengambil satu iklan spesifik berdasarkan ID dari Supabase
 */
export async function fetchListingByIdFromSupabase(listingId: string): Promise<Listing | null> {
  const client = getSupabaseClient();
  if (!client || !listingId) return null;

  try {
    const { data, error } = await client
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapRowToListing(data);
  } catch (err) {
    console.warn('Gagal fetch single listing dari Supabase:', err);
    return null;
  }
}

/**
 * Menyimpan iklan baru ke tabel 'listings' di Supabase
 */
export async function saveListingToSupabase(
  listing: Listing,
  userEmail?: string,
  userPhone?: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapListingToRow(listing, userEmail, userPhone);
    const { error } = await client.from('listings').upsert([row]);

    if (error) {
      console.error('Gagal menyimpan iklan ke Supabase:', error.message);
      return false;
    }

    console.log('✅ Iklan berhasil disimpan ke Supabase:', listing.id);
    return true;
  } catch (err) {
    console.error('Error saat menyimpan ke Supabase:', err);
    return false;
  }
}

/**
 * Memperbarui status iklan di Supabase (Sundul / Prioritas BU)
 */
export async function updateListingInSupabase(
  id: string,
  updates: Partial<{
    isSuperBU: boolean;
    sundulAt: string;
    createdAt: string;
    status: string;
    expires_at: string;
    sold_at: string;
    title: string;
    category: string;
    normal_price: number;
    selling_price: number;
    discount_percentage: number;
    location: string;
    condition: string;
    urgent_reason: string;
    image_url: string;
  }>
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload: any = {};
    if (updates.isSuperBU !== undefined) payload.is_priority = updates.isSuperBU;
    if (updates.createdAt) payload.created_at = updates.createdAt;
    if (updates.status) payload.status = updates.status;
    if (updates.expires_at) payload.expires_at = updates.expires_at;
    if (updates.sold_at) payload.sold_at = updates.sold_at;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.normal_price !== undefined) payload.normal_price = updates.normal_price;
    if (updates.selling_price !== undefined) payload.selling_price = updates.selling_price;
    if (updates.discount_percentage !== undefined) payload.discount_percentage = updates.discount_percentage;
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.condition !== undefined) payload.condition = updates.condition;
    if (updates.urgent_reason !== undefined) payload.urgent_reason = updates.urgent_reason;
    if (updates.image_url !== undefined) payload.image_url = updates.image_url;

    const { error } = await client.from('listings').update(payload).eq('id', id);

    if (error) {
      console.error('Gagal update iklan di Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error saat update di Supabase:', err);
    return false;
  }
}

/**
 * Menghapus iklan dari Supabase
 */
export async function deleteListingFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('listings').delete().eq('id', id);

    if (error) {
      console.error('Gagal menghapus iklan dari Supabase:', error.message);
      return false;
    }

    console.log('🗑️ Iklan berhasil dihapus dari Supabase:', id);
    return true;
  } catch (err) {
    console.error('Error saat delete dari Supabase:', err);
    return false;
  }
}

/**
 * Interface data pendaftaran user ke Supabase
 */
export interface SupabaseRegistrationPayload {
  id?: string;
  name: string;
  email: string;
  password?: string;
  whatsapp: string;
  phone?: string;
  role?: string;
  city?: string;
  listing_quota?: number;
  created_at?: string;
}

export const USERS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS public.users (
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
CREATE POLICY "Izinkan publik daftar user" ON public.users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Izinkan user baca data profil" ON public.users;
CREATE POLICY "Izinkan user baca data profil" ON public.users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Izinkan user update profil" ON public.users;
CREATE POLICY "Izinkan user update profil" ON public.users FOR UPDATE TO anon, authenticated USING (true);
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;`;

async function upsertUserToTableResilient(
  client: SupabaseClient,
  tableName: 'users' | 'profiles',
  userPayload: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  const cleanEmail = String(userPayload.email || '').trim().toLowerCase();

  // 1. Cek apakah row dengan email sudah ada -> UPDATE jika ada (tidak bergantung UNIQUE constraint)
  try {
    const { data: existingRow, error: checkErr } = await client
      .from(tableName)
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (checkErr && /relation .* does not exist|Could not find the table|PGRST205/i.test(checkErr.message)) {
      return { success: false, error: checkErr.message };
    }

    if (existingRow) {
      const updatePayload: Record<string, any> = {
        name: userPayload.name,
        whatsapp: userPayload.whatsapp,
        phone: userPayload.phone,
        city: userPayload.city,
        role: userPayload.role,
      };
      if (userPayload.password) updatePayload.password = userPayload.password;
      const { data: patched, error: patchErr } = await client
        .from(tableName)
        .update(updatePayload)
        .eq('email', cleanEmail)
        .select();

      if (!patchErr) {
        return { success: true, data: patched };
      }
      // Minimal update fallback
      const { data: minPatched, error: minPatchErr } = await client
        .from(tableName)
        .update({ name: userPayload.name, whatsapp: userPayload.whatsapp })
        .eq('email', cleanEmail)
        .select();
      if (!minPatchErr) {
        return { success: true, data: minPatched };
      }
    }
  } catch {
    // Lanjut ke insert
  }

  // 2. Insert bertahap (mengatasi perbedaan kolom opsional / tipe UUID id)
  const payloadWithoutId = { ...userPayload };
  delete payloadWithoutId.id;

  const insertVariants: Record<string, any>[] = [
    userPayload,
    payloadWithoutId,
    {
      name: userPayload.name,
      email: cleanEmail,
      whatsapp: userPayload.whatsapp,
      phone: userPayload.phone,
      role: userPayload.role || 'buyer',
      city: userPayload.city || 'Jakarta Selatan',
      created_at: userPayload.created_at,
    },
    {
      name: userPayload.name,
      email: cleanEmail,
      whatsapp: userPayload.whatsapp,
      created_at: userPayload.created_at,
    },
    {
      name: userPayload.name,
      email: cleanEmail,
      whatsapp: userPayload.whatsapp,
    },
  ];

  let lastError = '';
  for (const variant of insertVariants) {
    const { data, error } = await client.from(tableName).insert([variant]).select();
    if (!error) {
      return { success: true, data };
    }
    lastError = error.message;
    // Duplicate key email -> anggap sukses setelah patch atau langsung sukses
    if (/duplicate key|23505/i.test(error.message)) {
      return { success: true, data: [variant] };
    }
    // Jika tabel memang belum ada / izin ditolak RLS total -> stop mencoba ke tabel ini
    if (/relation .* does not exist|Could not find the table|PGRST205|row-level security|42501/i.test(error.message)) {
      break;
    }
  }

  return { success: false, error: lastError || `Gagal menyimpan ke tabel ${tableName}` };
}

/**
 * Menyimpan data pendaftaran user baru ke tabel 'users' di Supabase (dengan fallback skema & tabel 'profiles').
 */
export async function registerUserInSupabase(userData: {
  id?: string;
  name: string;
  email: string;
  password?: string;
  whatsapp: string;
  city?: string;
  role?: 'buyer' | 'seller';
  createdAt?: string;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('[Supabase DB] Client belum dikonfigurasi (berjalan dalam mode lokal).');
    return { success: false, error: 'Supabase client not configured' };
  }

  const cleanWa = (userData.whatsapp || '').trim();
  const cleanEmail = (userData.email || '').trim().toLowerCase();
  const cleanName = (userData.name || '').trim();

  const userPayload: Record<string, any> = {
    name: cleanName,
    email: cleanEmail,
    password: userData.password || '',
    whatsapp: cleanWa,
    phone: cleanWa,
    city: userData.city || 'Jakarta Selatan',
    role: userData.role || 'buyer',
    listing_quota: 1,
    created_at: userData.createdAt || new Date().toISOString(),
  };

  if (userData.id) {
    userPayload.id = userData.id;
  }

  try {
    const resUsers = await upsertUserToTableResilient(client, 'users', userPayload);
    if (resUsers.success) {
      console.log('✅ [Supabase DB] User berhasil disimpan ke tabel "users":', resUsers.data);
      return resUsers;
    }

    console.warn('⚠️ [Supabase DB] Insert ke tabel "users" gagal, mencoba tabel "profiles":', resUsers.error);
    const resProfiles = await upsertUserToTableResilient(client, 'profiles', userPayload);
    if (resProfiles.success) {
      console.log('✅ [Supabase DB] User berhasil disimpan ke tabel "profiles":', resProfiles.data);
      return resProfiles;
    }

    console.warn('⚠️ [Supabase DB] Insert ke "profiles" juga gagal:', resProfiles.error);
    return { success: false, error: resUsers.error || resProfiles.error };
  } catch (err: any) {
    console.error('❌ [Supabase DB Exception]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mencari data user berdasarkan email dari Supabase
 */
export async function fetchUserByEmailFromSupabase(email: string): Promise<any | null> {
  const client = getSupabaseClient();
  if (!client || !email) return null;

  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    const { data: profData } = await client
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    return profData || null;
  } catch (err) {
    console.warn('Gagal fetch user dari Supabase:', err);
    return null;
  }
}

async function safeSelectAllUsersFromTable(client: SupabaseClient, tableName: 'users' | 'profiles'): Promise<any[]> {
  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!error && Array.isArray(data)) {
      return data;
    }

    if (error && /created_at|column/i.test(error.message)) {
      const retry = await client.from(tableName).select('*').limit(500);
      if (!retry.error && Array.isArray(retry.data)) {
        return retry.data;
      }
    }
  } catch {
    // Ignore missing table
  }
  return [];
}

/**
 * Mengambil seluruh data user dari Supabase (gabungan tabel 'users' & 'profiles')
 * Digunakan oleh Panel Kontrol Admin untuk menampilkan seluruh pendaftar secara real-time.
 */
export async function fetchAllUsersFromSupabase(): Promise<any[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const [usersRows, profilesRows] = await Promise.all([
      safeSelectAllUsersFromTable(client, 'users'),
      safeSelectAllUsersFromTable(client, 'profiles'),
    ]);

    const byEmail = new Map<string, any>();
    for (const row of [...profilesRows, ...usersRows]) {
      const key = String(row?.email || row?.id || '').trim().toLowerCase();
      if (!key) continue;
      byEmail.set(key, { ...(byEmail.get(key) || {}), ...row });
    }

    return Array.from(byEmail.values());
  } catch (err) {
    console.warn('[Supabase DB] Gagal fetch all users:', err);
    return [];
  }
}

/**
 * Langganan Real-time Supabase (postgres_changes) untuk tabel 'users' dan 'profiles'.
 * Begitu ada user baru mendaftar dari perangkat manapun, Admin Dashboard langsung ter-update otomatis.
 */
export function subscribeToRegisteredUsersRealtime(
  onUserChange: (payload: any) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) {
    return () => {};
  }

  try {
    const channel = client
      .channel(`jualrugi-users-realtime-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          onUserChange(payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          onUserChange(payload);
        }
      )
      .subscribe();

    return () => {
      try {
        client.removeChannel(channel);
      } catch {
        // Ignore cleanup errors
      }
    };
  } catch {
    return () => {};
  }
}
