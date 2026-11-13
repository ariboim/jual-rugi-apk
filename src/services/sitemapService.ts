export interface SitemapListingItem {
  id: string;
  title?: string | null;
  category?: string | null;
  status?: string | null;
  isSuperBU?: boolean | null;
  is_priority?: boolean | null;
  is_super_bu?: boolean | null;
  imageUrl?: string | null;
  image_url?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  expiresAt?: string | null;
  expires_at?: string | null;
}

export interface SitemapEnv {
  APP_URL?: string;
  SITE_URL?: string;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

export const DEFAULT_SITE_ORIGIN = 'https://jualrugi.my.id';

const INACTIVE_STATUSES = new Set([
  'sold',
  'expired',
  'deleted',
  'in_moderation',
  'rejected',
  'draft',
  'archived',
]);

/**
 * Katalog listing aktif bawaan sebagai fallback ketika Supabase env belum dikonfigurasi di server/worker.
 */
export const FALLBACK_ACTIVE_LISTINGS: SitemapListingItem[] = [
  {
    id: 'bu-001',
    title: 'iPhone 14 Pro 128GB Deep Purple - BU Beli Susu Anak',
    category: 'Smartphone & Gadget',
    status: 'active',
    isSuperBU: true,
    imageUrl: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'bu-002',
    title: 'Honda Beat Deluxe CBS ISS 2023 Surat Lengkap Pajak Hidup',
    category: 'Sepeda Motor',
    status: 'active',
    isSuperBU: true,
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'bu-003',
    title: 'MacBook Pro M1 2020 16GB 512GB Space Gray - BU Skripsi',
    category: 'Laptop & Komputer',
    status: 'active',
    isSuperBU: false,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'bu-004',
    title: 'Smart TV LG 55 Inch 4K UHD ThinQ Model 2023 Lengkap Remote Magic',
    category: 'Elektronik Rumah Tangga',
    status: 'active',
    isSuperBU: true,
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'bu-005',
    title: 'Asus ROG Zephyrus G14 Ryzen 7 RTX 3060 16GB 512GB Gaming Laptop',
    category: 'Laptop & Komputer',
    status: 'active',
    isSuperBU: false,
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'bu-006',
    title: 'Kulkas 2 Pintu Inverter Sharp No Frost Masih Dingin Salju',
    category: 'Elektronik Rumah Tangga',
    status: 'active',
    isSuperBU: false,
    imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'bu-007',
    title: 'Yamaha NMAX 155 Connected ABS 2022 Plat B Pajak Panjang',
    category: 'Sepeda Motor',
    status: 'active',
    isSuperBU: true,
    imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'bu-008',
    title: 'Samsung Galaxy S23 Ultra 512GB Phantom Black Snapdragon 8 Gen 2',
    category: 'Smartphone & Gadget',
    status: 'active',
    isSuperBU: false,
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1000&q=80',
  },
];

export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function resolveSiteOrigin(env?: SitemapEnv, requestUrl?: string): string {
  const candidate = (env?.SITE_URL || env?.APP_URL || '').trim();
  if (candidate && candidate.startsWith('http') && !candidate.includes('MY_APP_URL')) {
    return candidate.replace(/\/+$/, '');
  }
  if (requestUrl) {
    try {
      const parsed = new URL(requestUrl);
      if (parsed.hostname && !parsed.hostname.includes('localhost') && !parsed.hostname.includes('127.0.0.1')) {
        return parsed.origin.replace(/\/+$/, '');
      }
    } catch {
      // ignore invalid requestUrl
    }
  }
  return DEFAULT_SITE_ORIGIN;
}

export function isListingActiveAndPublished(item: SitemapListingItem, nowMs = Date.now()): boolean {
  if (!item || !item.id || typeof item.id !== 'string' || !item.id.trim()) {
    return false;
  }
  const normalizedStatus = (item.status || 'active').trim().toLowerCase();
  if (INACTIVE_STATUSES.has(normalizedStatus)) {
    return false;
  }
  const expiryRaw = item.expiresAt || item.expires_at;
  if (expiryRaw) {
    const expiryMs = Date.parse(expiryRaw);
    if (!Number.isNaN(expiryMs) && expiryMs <= nowMs) {
      return false;
    }
  }
  return true;
}

function toValidIsoDate(raw?: string | null, fallbackIso?: string): string {
  if (raw) {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return fallbackIso || new Date().toISOString();
}

/**
 * Mengambil seluruh listing aktif & terpublikasi langsung dari Supabase REST API
 * apabila kredensial server tersedia, dengan fallback aman ke katalog aktif default.
 */
export async function fetchActiveListingsForSitemap(env?: SitemapEnv): Promise<{
  listings: SitemapListingItem[];
  source: 'supabase' | 'fallback';
}> {
  const supabaseUrl = (env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseKey = (
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    env?.SUPABASE_ANON_KEY ||
    env?.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (
    supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseKey &&
    supabaseKey.length > 20 &&
    !supabaseKey.includes('...')
  ) {
    try {
      const endpoint =
        `${supabaseUrl}/rest/v1/listings` +
        `?select=id,title,category,status,is_priority,is_super_bu,image_url,created_at,expires_at` +
        `&or=(status.is.null,status.eq.active,status.eq.published)` +
        `&order=created_at.desc` +
        `&limit=5000`;

      const res = await fetch(endpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const rows = (await res.json()) as unknown;
        if (Array.isArray(rows)) {
          const activeRows = rows.filter((row): row is SitemapListingItem =>
            isListingActiveAndPublished(row as SitemapListingItem)
          );
          if (activeRows.length > 0) {
            return { listings: activeRows, source: 'supabase' };
          }
        }
      }
    } catch (err) {
      console.warn('[Sitemap] Gagal mengambil data Supabase, beralih ke fallback katalog aktif:', err);
    }
  }

  return {
    listings: FALLBACK_ACTIVE_LISTINGS.filter((item) => isListingActiveAndPublished(item)),
    source: 'fallback',
  };
}

/**
 * Menghasilkan dokumen XML Sitemap valid standar Sitemaps.org + Google Image Sitemap.
 */
export function buildSitemapXml(
  listings: SitemapListingItem[],
  siteOrigin: string = DEFAULT_SITE_ORIGIN
): string {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  const nowIso = new Date().toISOString();
  const seenIds = new Set<string>();
  const activeListings: SitemapListingItem[] = [];

  for (const item of listings) {
    if (!isListingActiveAndPublished(item)) continue;
    const cleanId = item.id.trim();
    const dedupeKey = cleanId.toLowerCase();
    if (seenIds.has(dedupeKey)) continue;
    seenIds.add(dedupeKey);
    activeListings.push(item);
  }

  const latestListingIso =
    activeListings.length > 0
      ? toValidIsoDate(
          activeListings[0].updated_at || activeListings[0].createdAt || activeListings[0].created_at,
          nowIso
        )
      : nowIso;

  const urlNodes: string[] = [
    [
      '  <url>',
      `    <loc>${escapeXml(`${cleanOrigin}/`)}</loc>`,
      `    <lastmod>${escapeXml(latestListingIso)}</lastmod>`,
      '    <changefreq>hourly</changefreq>',
      '    <priority>1.0</priority>',
      '  </url>',
    ].join('\n'),
  ];

  for (const item of activeListings) {
    const cleanId = item.id.trim();
    const productUrl = `${cleanOrigin}/product/${encodeURIComponent(cleanId)}`;
    const lastmod = toValidIsoDate(
      item.updated_at || item.createdAt || item.created_at,
      nowIso
    );
    const isPriority = Boolean(item.isSuperBU || item.is_priority || item.is_super_bu);
    const priority = isPriority ? '0.9' : '0.8';
    const rawImage = (item.imageUrl || item.image_url || '').trim();
    const hasHttpImage = rawImage.startsWith('https://') || rawImage.startsWith('http://');

    const lines = [
      '  <url>',
      `    <loc>${escapeXml(productUrl)}</loc>`,
      `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
      '    <changefreq>daily</changefreq>',
      `    <priority>${priority}</priority>`,
    ];

    if (hasHttpImage) {
      lines.push('    <image:image>');
      lines.push(`      <image:loc>${escapeXml(rawImage)}</image:loc>`);
      if (item.title && item.title.trim()) {
        lines.push(`      <image:title>${escapeXml(item.title.trim())}</image:title>`);
      }
      lines.push('    </image:image>');
    }

    lines.push('  </url>');
    urlNodes.push(lines.join('\n'));
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urlNodes,
    '</urlset>',
    '',
  ].join('\n');
}

export async function generateDynamicSitemap(options?: {
  env?: SitemapEnv;
  requestUrl?: string;
  extraListings?: SitemapListingItem[];
}): Promise<{ xml: string; count: number; source: 'supabase' | 'fallback' }> {
  const siteOrigin = resolveSiteOrigin(options?.env, options?.requestUrl);
  const { listings, source } = await fetchActiveListingsForSitemap(options?.env);
  const combined = options?.extraListings
    ? [...options.extraListings, ...listings]
    : listings;
  const xml = buildSitemapXml(combined, siteOrigin);
  const activeCount = combined.filter((item) => isListingActiveAndPublished(item)).length;
  return {
    xml,
    count: activeCount,
    source,
  };
}
