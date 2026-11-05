import { Category, ProductPhoto } from '../types';

export interface AdminTestPreset {
  id: string;
  title: string;
  category: Category;
  normalPrice: number;
  sellingPrice: number;
  discountPercentage: number;
  location: string;
  condition: string;
  urgentReason: string;
  imageUrl: string;
  photos: ProductPhoto[];
  tagLabel: string;
}

/**
 * 4 Preset Iklan Real dengan Foto Fisik Asli (Unsplash High-Res Real Photos)
 * Setiap preset memiliki foto barang fisik bekas nyata (iPhone, MacBook, Motor, Smart TV)
 * lengkap dengan rincian minus fisik wajar dan alasan BU realistis.
 */
export const ADMIN_TEST_PRESETS: AdminTestPreset[] = [
  {
    id: 'test-preset-iphone',
    tagLabel: '📱 iPhone 13 (Gadget)',
    title: 'iPhone 13 128GB Midnight Ex-iBox Fullset Mulus COD',
    category: 'Smartphone & Gadget',
    normalPrice: 10500000,
    sellingPrice: 6200000,
    discountPercentage: 41,
    location: 'Jakarta Selatan (Blok M / Fatmawati)',
    condition: 'Unit pemakaian pribadi ex-iBox, battery health 87%, TrueTone & FaceID normal. Ada lecet halus pemakaian wajar di dekat lubang charger. Fullset box original dan kabel bawaan.',
    urgentReason: 'Butuh uang cepat hari ini untuk bayar perpanjangan sewa tempat usaha bulanan. Siap COD tatap muka di tempat ramai.',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80',
    photos: [
      {
        id: 'photo-ip-1',
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80',
        caption: 'Tampak Depan (Layar OLED 100% Nyala & TrueTone Aktif)',
        label: 'Tampak Depan',
      },
      {
        id: 'photo-ip-2',
        url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
        caption: 'Bodi Belakang & Dual Kamera Kaca Mulus Tanpa Retak',
        label: 'Tampak Belakang',
      },
      {
        id: 'photo-ip-3',
        url: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1000&q=80',
        caption: 'Sisi Bezel & Lubang Speaker (Detail Minus Lecet Halus)',
        label: 'Detail Bezel',
      },
      {
        id: 'photo-ip-4',
        url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80',
        caption: 'Kelengkapan Dus Box Asli Sesuai Nomor IMEI',
        label: 'Kelengkapan Dus',
      },
    ],
  },
  {
    id: 'test-preset-macbook',
    tagLabel: '💻 MacBook Pro M1 (Laptop)',
    title: 'MacBook Pro M1 2020 8/256GB Space Grey Baterai Normal',
    category: 'Laptop & Komputer',
    normalPrice: 14800000,
    sellingPrice: 8900000,
    discountPercentage: 40,
    location: 'Jakarta Pusat (Menteng / Sudirman)',
    condition: 'Fisik mulus 95%, keyboard empuk tanpa kendala, cycle count baterai 210 normal. Layar Retina jernih bebas dead pixel. Charger Type-C bawaan lengkap.',
    urgentReason: 'BU darurat modal usaha akhir bulan, siap nego tipis saat COD langsung.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
    photos: [
      {
        id: 'photo-mac-1',
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
        caption: 'Layar Retina 13.3 Inci Nyala Jernih & Bodi Space Grey',
        label: 'Tampak Depan Layar',
      },
      {
        id: 'photo-mac-2',
        url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80',
        caption: 'Cover Atas Aluminium Kokoh Bebas Dent Parah',
        label: 'Cover Atas',
      },
      {
        id: 'photo-mac-3',
        url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80',
        caption: 'Keyboard Magic & Touch Bar Responsif Lancar',
        label: 'Keyboard & Trackpad',
      },
    ],
  },
  {
    id: 'test-preset-motor',
    tagLabel: '🛵 Honda Vario 150 (Motor)',
    title: 'Honda Vario 150 CBS ISS 2021 Surat Lengkap Pajak Hidup',
    category: 'Sepeda Motor',
    normalPrice: 21500000,
    sellingPrice: 14200000,
    discountPercentage: 34,
    location: 'Jakarta Timur (Rawamangun)',
    condition: 'Mesin halus rawatan AHASS berkala, CVT aman tanpa gredek, ban tebal 90%. Pajak STNK panjang, BPKB & faktur komplit atas nama pertama.',
    urgentReason: 'Butuh uang biaya rawat inap keluarga, lepas cepat siapa cepat dapat COD Polsek.',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
    photos: [
      {
        id: 'photo-vario-1',
        url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
        caption: 'Fisik Samping Motor Bersih Terawat Mesin Sehat',
        label: 'Tampak Samping',
      },
      {
        id: 'photo-vario-2',
        url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
        caption: 'Speedometer Digital & Stang Pengemudi Kunci Kontak Keyless',
        label: 'Area Kokpit & Speedo',
      },
    ],
  },
  {
    id: 'test-preset-tv',
    tagLabel: '📺 Smart TV Sony 55" (Elektronik)',
    title: 'Sony Bravia 55 Inch 4K HDR Android Smart TV Garansi Masih Ada',
    category: 'Elektronik Rumah Tangga',
    normalPrice: 8500000,
    sellingPrice: 4900000,
    discountPercentage: 42,
    location: 'Jakarta Barat (Kebon Jeruk)',
    condition: 'Gambar 4K bening sempurna tanpa tompel atau garis, speaker Dolby Audio menggelegar, remote voice bawaan normal. Dus dan kaki original tersimpan rapi.',
    urgentReason: 'Mau pindah domisili luar pulau akhir pekan ini, barang besar tidak bisa dibawa.',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80',
    photos: [
      {
        id: 'photo-tv-1',
        url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80',
        caption: 'Layar 55 Inch 4K HDR Menyala Mulus Jernih',
        label: 'Layar TV Nyala',
      },
      {
        id: 'photo-tv-2',
        url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=1000&q=80',
        caption: 'Bodi Belakang & Port HDMI eARC Lengkap',
        label: 'Port Belakang',
      },
    ],
  },
];
