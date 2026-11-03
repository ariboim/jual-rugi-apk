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
 * Konversi baris data dari Supabase ke format Listing aplikasi JualRugi.id
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
    seller_email: userEmail || 'member@jualrugi.id',
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
