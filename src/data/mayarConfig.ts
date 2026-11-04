import { MayarProductConfig, MonetizationPackage } from '../types';

/**
 * Konfigurasi Resmi Produk Monetisasi JualRugi.my.id dengan Payment Gateway Mayar.id
 */
export const MAYAR_PRODUCTS: Record<MonetizationPackage, MayarProductConfig> = {
  sundul: {
    id: 'sundul',
    name: 'Sundul Iklan',
    price: 25000,
    paymentUrl: 'https://jualrugi.mayar.link/pl/sundul-iklan',
    description: 'Pindahkan posisi iklan langsung ke urutan #1 teratas feed secara instan.',
    features: [
      'Naik ke urutan #1 feed teratas secara instan',
      'Mendapatkan bonus kuota +1 slot pasang iklan baru',
      'Meningkatkan views & chat COD hingga 3x lipat',
      'Berlaku langsung begitu pembayaran terverifikasi',
    ],
  },
  prioritas_bu: {
    id: 'prioritas_bu',
    name: 'Prioritas BU Banget',
    price: 75000,
    paymentUrl: 'https://jualrugi.mayar.link/pl/prioritas-bu-banget',
    description: 'Highlight kuning emas & lencana eksklusif PALING BU selama 24 jam penuh.',
    features: [
      'Lencana "PALING BU" & highlight kuning menyala 24 jam',
      'Mendapatkan bonus kuota +1 slot pasang iklan baru',
      'Prioritas di radar pencarian pembeli siap COD',
      'Dukungan promosi di bagian atas beranda',
    ],
  },
};

/**
 * Helper untuk menyusun URL Checkout Mayar dengan parameter identitas user & listing
 */
export function buildMayarCheckoutUrl(
  packageType: MonetizationPackage,
  userId: string,
  listingId?: string,
  customerEmail?: string
): string {
  const product = MAYAR_PRODUCTS[packageType];
  const url = new URL(product.paymentUrl);
  url.searchParams.set('amount', product.price.toString());
  url.searchParams.set('customer_id', userId);
  if (customerEmail) url.searchParams.set('email', customerEmail);
  if (listingId) url.searchParams.set('item_id', listingId);
  url.searchParams.set('package_type', packageType);
  url.searchParams.set('redirect_url', window.location.origin + '?payment_success=true&package=' + packageType);
  return url.toString();
}
