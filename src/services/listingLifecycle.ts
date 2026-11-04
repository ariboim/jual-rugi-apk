import { Listing, Category } from '../types';

/**
 * Durasi masa tayang standar untuk iklan di JualRugi.my.id: 30 Hari
 */
export const LISTING_LIFESPAN_DAYS = 30;
export const LISTING_LIFESPAN_MS = LISTING_LIFESPAN_DAYS * 24 * 60 * 60 * 1000;

/**
 * ============================================================================
 * 4. AUTO-SEEDING / MOCK IKLAN TERJUAL (MINIMAL 3 IKLAN ORGANIK PER HARI)
 * ============================================================================
 * Foto open-source real barang bekas/organik nyata (gadget, motor, laptop, kamera).
 * Bukan grafik ilustrasi/vector. Status diset 'sold' untuk social proof & FOMO.
 */
export const DAILY_SOLD_SEEDED_LISTINGS: Listing[] = [
  {
    id: 'sold-daily-001',
    title: 'iPhone 13 128GB Midnight Ex-iBox Mulus Fullset - Laku Terjual COD',
    category: 'Smartphone & Gadget',
    normalPrice: 10500000,
    sellingPrice: 6800000,
    discountPercentage: 35,
    location: 'Jakarta Barat',
    condition: 'Kondisi 96% mulus, BH 88% TrueTone FaceID aman. Ada lecet halus pemakaian di pojok casing.',
    urgentReason: 'Butuh uang bayar sewa kontrakan. Sudah deal COD tatap muka di Mall Central Park.',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
    isSuperBU: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 jam lalu
    expiresAt: new Date(Date.now() + LISTING_LIFESPAN_MS).toISOString(),
    soldAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // Terjual 2 jam lalu
    status: 'sold',
    seller: {
      id: 'seller-reza',
      name: 'Reza Fahlevi',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      location: 'Jakarta Barat',
      codVerified: true,
      rating: 4.9,
      dealsCompleted: 19,
      joinedDate: 'Februari 2024',
      phoneMasked: '0813-8877-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Unit telah diverifikasi & sukses transaksi COD tatap muka.',
    views: 428,
    savedCount: 54,
  },
  {
    id: 'sold-daily-002',
    title: 'Yamaha NMAX 155 ABS 2021 Abu Matte Surat Lengkap - Terjual Cepat BU',
    category: 'Sepeda Motor',
    normalPrice: 28500000,
    sellingPrice: 19200000,
    discountPercentage: 33,
    location: 'Tangerang Kota',
    condition: 'Odo 22.xxx km, mesin standar ting-ting, ban Pirelli baru ganti. Pajak panjang hidup.',
    urgentReason: 'BU modal usaha darurat. Laku cepat via titik COD aman Polsek Tangerang.',
    imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    isSuperBU: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 jam lalu
    expiresAt: new Date(Date.now() + LISTING_LIFESPAN_MS).toISOString(),
    soldAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // Terjual 4 jam lalu
    status: 'sold',
    seller: {
      id: 'seller-hendra',
      name: 'Hendra Gunawan',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      location: 'Tangerang Kota',
      codVerified: true,
      rating: 4.8,
      dealsCompleted: 11,
      joinedDate: 'Januari 2024',
      phoneMasked: '0856-7788-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Surat BPKB/STNK fisik telah diverifikasi & closing deal.',
    views: 651,
    savedCount: 89,
  },
  {
    id: 'sold-daily-003',
    title: 'Sony PlayStation 5 Disc Edition + 2 Stik DualSense - Laku Closing Hari Ini',
    category: 'Elektronik Rumah Tangga',
    normalPrice: 8500000,
    sellingPrice: 5400000,
    discountPercentage: 36,
    location: 'Jakarta Selatan',
    condition: 'Fullset dus original kabel komplit, pemakaian santai di kamar ber-AC. Segel resmi.',
    urgentReason: 'Dilepas butuh uang nebus servis mobil. Closing deal tunai langsung di tempat.',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
    isSuperBU: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    expiresAt: new Date(Date.now() + LISTING_LIFESPAN_MS).toISOString(),
    soldAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: 'sold',
    seller: {
      id: 'seller-deny',
      name: 'Deny Kurnia',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      location: 'Jakarta Selatan',
      codVerified: true,
      rating: 5.0,
      dealsCompleted: 14,
      joinedDate: 'Desember 2023',
      phoneMasked: '0878-1122-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Perangkat terverifikasi normal & pembayaran COD tunai berhasil.',
    views: 512,
    savedCount: 63,
  },
];

/**
 * ============================================================================
 * 1. CHECK & AUTO-EXPIRE LISTING (MASA TAYANG 30 HARI)
 * ============================================================================
 * Mengecek apakah listing aktif sudah berusia >= 30 hari.
 * Jika ya: status otomatis diubah ke 'expired' dan refund kuota (+1 slot).
 */
export interface ExpirationResult {
  updatedListings: Listing[];
  expiredListings: Listing[];
  refundCount: number;
}

export function checkAndExpireListings(
  listings: Listing[],
  currentUserId?: string
): ExpirationResult {
  const now = Date.now();
  const expiredListings: Listing[] = [];
  let refundCount = 0;

  const updatedListings = listings.map((listing) => {
    // Iklan yang sudah sold / deleted / expired tidak diproses lagi
    if (listing.status && listing.status !== 'active') {
      return listing;
    }

    const createdTime = new Date(listing.createdAt).getTime();
    const isPast30Days = now - createdTime >= LISTING_LIFESPAN_MS;

    if (isPast30Days) {
      const expiredItem: Listing = {
        ...listing,
        status: 'expired',
        expiresAt: new Date(createdTime + LISTING_LIFESPAN_MS).toISOString(),
      };
      expiredListings.push(expiredItem);

      // Jika iklan milik pengguna yang sedang aktif, hitung kuota yang harus di-refund (+1)
      if (currentUserId && (listing.seller.id === currentUserId || listing.seller.id === 'seller-agus')) {
        refundCount += 1;
      }

      return expiredItem;
    }

    // Default status active
    return {
      ...listing,
      status: listing.status || 'active',
      expiresAt:
        listing.expiresAt || new Date(createdTime + LISTING_LIFESPAN_MS).toISOString(),
    };
  });

  return {
    updatedListings,
    expiredListings,
    refundCount,
  };
}

/**
 * Hitung sisa hari masa tayang (dari 30 hari)
 */
export function getDaysRemaining(createdAt: string): number {
  const createdTime = new Date(createdAt).getTime();
  const expireTime = createdTime + LISTING_LIFESPAN_MS;
  const diffMs = expireTime - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Helper status aktif iklan
 */
export function isListingActive(listing: Listing): boolean {
  if (listing.status === 'sold' || listing.status === 'expired' || listing.status === 'deleted') {
    return false;
  }
  const createdTime = new Date(listing.createdAt).getTime();
  return Date.now() - createdTime < LISTING_LIFESPAN_MS;
}

export interface AdExpiryDetails {
  expiresAtDate: Date;
  formattedShort: string; // contoh: "24/11/26"
  formattedLong: string;  // contoh: "24 Nov 2026"
  formattedText: string;  // contoh: "YOUR AD EXPIRES ON 24/11/26"
  daysRemaining: number;
  isExpired: boolean;
  isUrgent: boolean; // Tersisa <= 3 hari
}

/**
 * Mendapatkan detail tanggal kedaluwarsa iklan dan format teks sesuai mockup
 * Format teks: "YOUR AD EXPIRES ON DD/MM/YY"
 */
export function getAdExpiryInfo(listing: Listing): AdExpiryDetails {
  const createdTime = new Date(listing.createdAt || Date.now()).getTime();
  const expiresAtMs = listing.expiresAt
    ? new Date(listing.expiresAt).getTime()
    : createdTime + LISTING_LIFESPAN_MS;
  const expiresAtDate = new Date(expiresAtMs);

  const day = String(expiresAtDate.getDate()).padStart(2, '0');
  const month = String(expiresAtDate.getMonth() + 1).padStart(2, '0');
  const yearShort = String(expiresAtDate.getFullYear()).slice(-2);

  const formattedShort = `${day}/${month}/${yearShort}`;
  const formattedLong = expiresAtDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const diffMs = expiresAtMs - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = listing.status === 'expired' || diffMs <= 0;
  const isUrgent = !isExpired && daysRemaining <= 3;

  const formattedText = isExpired
    ? `YOUR AD EXPIRED ON ${formattedShort}`
    : `YOUR AD EXPIRES ON ${formattedShort}`;

  return {
    expiresAtDate,
    formattedShort,
    formattedLong,
    formattedText,
    daysRemaining,
    isExpired,
    isUrgent,
  };
}

/**
 * Validasi otorisasi kepemilikan listing (Auth Check)
 * Hanya pemilik iklan (seller) yang berhak melihat tanggal kadaluarsa iklan
 */
export function isListingOwner(
  listing: Listing,
  currentUserId?: string,
  currentUserEmail?: string,
  isSellerMode?: boolean
): boolean {
  if (!currentUserId && !currentUserEmail) return false;

  if (listing.user_id && currentUserId && listing.user_id === currentUserId) {
    return true;
  }
  if (currentUserId && listing.seller?.id === currentUserId) {
    return true;
  }
  if (
    currentUserEmail &&
    (listing.seller?.id === currentUserEmail || (listing as any).seller_email === currentUserEmail)
  ) {
    return true;
  }
  // Pada mode simulasi seller Agus Setiawan (seller-agus)
  if (isSellerMode && (currentUserId === 'seller-agus' || listing.seller?.id === 'seller-agus')) {
    return true;
  }
  return false;
}
