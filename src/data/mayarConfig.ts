import { MayarProductConfig, MonetizationPackage } from '../types';

/**
 * DAFTAR KONSTANTA RESMI PEMBAYARAN MAYAR & ADMIN JUALRUGI.MY.ID
 */
export const MAYAR_SUNDUL_URL = 'https://indo-digital.myr.id/plink/sundul-iklan';
export const MAYAR_BU_PRIORITAS_URL = 'https://indo-digital.myr.id/plink/link-pembayaran-bu-prioritas';
export const WA_ADMIN_PHONE = '6289673686625';

/**
 * Konfigurasi Resmi Produk Monetisasi JualRugi.my.id dengan Payment Gateway Mayar.id
 */
export const MAYAR_PRODUCTS: Record<MonetizationPackage, MayarProductConfig> = {
  sundul: {
    id: 'sundul',
    name: 'Sundul Iklan',
    price: 25000,
    paymentUrl: MAYAR_SUNDUL_URL,
    description: 'Pindahkan posisi iklan langsung ke urutan #1 teratas feed secara instan.',
    features: [
      'Naik ke urutan #1 feed teratas secara instan',
      'Mendapatkan bonus kuota +1 slot pasang iklan baru',
      'Meningkatkan views & chat COD hingga 3x lipat',
      'Berlaku langsung begitu verifikasi pembayaran selesai',
    ],
  },
  prioritas_bu: {
    id: 'prioritas_bu',
    name: 'Pasang BU Prioritas',
    price: 75000,
    paymentUrl: MAYAR_BU_PRIORITAS_URL,
    description: 'Highlight kuning emas menyala & lencana eksklusif PALING BU selama 24 jam penuh.',
    features: [
      'Lencana "PALING BU" & highlight kuning emas 24 jam',
      'Mendapatkan bonus kuota +1 slot pasang iklan baru',
      'Prioritas utama di radar pencarian pembeli siap COD',
      'Dukungan promosi di baris paling atas feed',
    ],
  },
};

/**
 * Helper untuk menyusun URL Checkout Mayar
 */
export function buildMayarCheckoutUrl(
  packageType: MonetizationPackage,
  userId?: string,
  listingId?: string,
  customerEmail?: string
): string {
  const product = MAYAR_PRODUCTS[packageType];
  try {
    const url = new URL(product.paymentUrl);
    if (userId) url.searchParams.set('customer_id', userId);
    if (customerEmail) url.searchParams.set('email', customerEmail);
    if (listingId) url.searchParams.set('item_id', listingId);
    return url.toString();
  } catch {
    return product.paymentUrl;
  }
}

export interface WhatsAppConfirmationParams {
  id_iklan: string;
  nama_paket: string;
  nominal?: number | string;
  judul_iklan?: string;
  nama_pengiklan?: string;
}

/**
 * Menghasilkan Teks Pesan Wajib untuk Konfirmasi WhatsApp Admin
 * Sesuai spesifikasi template resmi:
 * Halo Admin JualRugi, saya ingin konfirmasi pembayaran untuk aktivasi Iklan Prioritas/Sundul.
 * 
 * - ID Iklan: [ID_IKLAN_DINAMIS]
 * - Nama Paket: [NAMA_PAKET]
 * - Lampiran/Status: (Mohon sertakan bukti transfer di chat ini)
 * 
 * Mohon segera diaktivasi ya, terima kasih.
 */
export function generateWhatsAppMessage(params: WhatsAppConfirmationParams): string {
  return `Halo Admin JualRugi, saya ingin konfirmasi pembayaran untuk aktivasi Iklan Prioritas/Sundul.

- ID Iklan: ${params.id_iklan}
- Nama Paket: ${params.nama_paket}
- Lampiran/Status: (Mohon sertakan bukti transfer di chat ini)

Mohon segera diaktivasi ya, terima kasih.`;
}

/**
 * Menghasilkan URL target WhatsApp API resmi dengan encodeURIComponent ke nomor Admin (WA_ADMIN_PHONE)
 */
export function buildWhatsAppConfirmationUrl(params: WhatsAppConfirmationParams): string {
  const message = generateWhatsAppMessage(params);
  return `https://wa.me/${WA_ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
}

