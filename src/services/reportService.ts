/**
 * Layanan Pelaporan Iklan Curang / Tidak Sesuai (Ad Reporting Service)
 * Platform: JualRugi.my.id
 *
 * Mengelola pelaporan iklan oleh pembeli (indikasi penipuan DP, barang palsu, dll)
 * dan menghubungkannya langsung ke panel dashboard kontrol admin.
 */

export type AdReportReason =
  | 'dp_scam' // Meminta transfer DP sebelum COD
  | 'fake_goods' // Barang palsu / KW / tidak sesuai foto
  | 'fake_price' // Harga jebakan / tidak wajar / modus phishing
  | 'suspicious_seller' // Penjual mencurigakan / kontak di luar platform
  | 'stolen_illegal' // Barang curian / rusak berat / ilegal
  | 'other'; // Alasan lainnya

export interface AdReportReasonOption {
  id: AdReportReason;
  label: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export const AD_REPORT_REASONS: AdReportReasonOption[] = [
  {
    id: 'dp_scam',
    label: 'Penipuan / Meminta Transfer DP sebelum COD',
    description: 'Penjual memaksa transfer uang muka/ongkir sebelum bertemu langsung (Melanggar SOP JualRugi).',
    severity: 'high',
  },
  {
    id: 'fake_goods',
    label: 'Barang Palsu / KW / Tidak Sesuai Foto',
    description: 'Produk fisik tidak asli, kondisi minus disembunyikan, atau foto comotan dari internet.',
    severity: 'high',
  },
  {
    id: 'fake_price',
    label: 'Harga Palsu / Jebakan / Modus Phishing',
    description: 'Harga tertera tidak sesuai saat dihubungi atau mengarahkan ke link website berbahaya.',
    severity: 'high',
  },
  {
    id: 'suspicious_seller',
    label: 'Penjual Mencurigakan / Memaksa Chat Ilegal',
    description: 'Penjual tidak mau diajak COD di tempat umum ramai atau identitasnya meragukan.',
    severity: 'medium',
  },
  {
    id: 'stolen_illegal',
    label: 'Barang Curian / Rusak Total / Ilegal',
    description: 'Indikasi barang hilang/curian (tanpa dos/imei terblokir) atau produk rusak parah.',
    severity: 'high',
  },
  {
    id: 'other',
    label: 'Pelanggaran Lainnya',
    description: 'Spam, duplikasi iklan berulang, atau kategori produk tidak pantas.',
    severity: 'low',
  },
];

export interface AdReport {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImageUrl?: string;
  listingLocation?: string;
  sellerId: string;
  sellerName: string;
  sellerWhatsapp?: string;
  reporterName: string;
  reporterContact?: string; // Email atau nomor WA pelapor
  reporterUserId?: string;
  reason: AdReportReason;
  reasonLabel: string;
  notes?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

const STORAGE_KEY_REPORTS = 'jualrugi_ad_reports';

// Contoh data laporan awal agar Admin Dashboard langsung siap diverifikasi
export const INITIAL_DEMO_REPORTS: AdReport[] = [
  {
    id: 'rep-sim-001',
    listingId: 'bu-001',
    listingTitle: 'iPhone 14 Pro 128GB Deep Purple - BU Beli Susu Anak',
    listingPrice: 8900000,
    listingImageUrl: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1000&q=80',
    listingLocation: 'Jakarta Selatan',
    sellerId: 'seller-agus',
    sellerName: 'Agus Setiawan (Seller)',
    sellerWhatsapp: '6289673686625',
    reporterName: 'Budi Pembeli (Pelapor)',
    reporterContact: '6281299887766',
    reporterUserId: 'buyer-rian',
    reason: 'dp_scam',
    reasonLabel: 'Penipuan / Meminta Transfer DP sebelum COD',
    notes: 'Penjual memaksa saya transfer uang tanda jadi (DP) Rp 300.000 dengan alasan barang banyak yang minat, padahal melanggar SOP JualRugi yang mewajibkan COD tanpa DP.',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

/**
 * Membuat simulasi 1 laporan baru untuk keperluan uji coba visualisasi admin
 */
export function generateDemoReport(customListing?: {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  location?: string;
  sellerId?: string;
  sellerName?: string;
  sellerWhatsapp?: string;
}): AdReport {
  const demo: AdReport = {
    id: `rep-sim-${Date.now().toString().slice(-4)}`,
    listingId: customListing?.id || 'bu-001',
    listingTitle: customListing?.title || 'iPhone 14 Pro 128GB Deep Purple - BU Beli Susu Anak',
    listingPrice: customListing?.price || 8900000,
    listingImageUrl:
      customListing?.imageUrl ||
      'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1000&q=80',
    listingLocation: customListing?.location || 'Jakarta Selatan',
    sellerId: customListing?.sellerId || 'seller-agus',
    sellerName: customListing?.sellerName || 'Agus Setiawan (Seller)',
    sellerWhatsapp: customListing?.sellerWhatsapp || '6289673686625',
    reporterName: 'Budi Santoso (Pembeli)',
    reporterContact: '6281299887766',
    reporterUserId: 'buyer-budi',
    reason: 'dp_scam',
    reasonLabel: 'Penipuan / Meminta Transfer DP sebelum COD',
    notes:
      'Penjual memaksa transfer uang tanda jadi (DP) Rp 300.000 via transfer bank sebelum COD dengan dalih banyak calon pembeli yang antre. Melanggar aturan COD tanpa DP.',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const current = getStoredAdReports();
  // Pastikan simulasi ini berada di paling atas
  const updated = [demo, ...current.filter((r) => r.id !== demo.id)];
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jualrugi_new_ad_report', { detail: demo }));
    }
  } catch {}
  return demo;
}

/**
 * Mengambil seluruh daftar laporan dari penyimpanan lokal
 */
export function getStoredAdReports(): AdReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade data demo lama (bu-003) ke listing bu-001 yang aktif
        let needsSave = false;
        const upgraded = parsed.map((item) => {
          if ((item.id === 'rep-demo-001' && item.listingId === 'bu-003') || item.id === 'rep-sim-001') {
            needsSave = true;
            return {
              ...INITIAL_DEMO_REPORTS[0],
              id: item.id || INITIAL_DEMO_REPORTS[0].id,
            };
          }
          return item;
        });
        if (needsSave) {
          localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(upgraded));
        }
        return upgraded;
      }
    }
  } catch (e) {
    console.warn('[ReportService] Gagal membaca storage laporan:', e);
  }

  // Simpan data inisial demo jika belum ada
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(INITIAL_DEMO_REPORTS));
  } catch {}
  return INITIAL_DEMO_REPORTS;
}

/**
 * Membuat dan menyimpan laporan baru dari pembeli
 */
export function createAdReport(params: {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImageUrl?: string;
  listingLocation?: string;
  sellerId: string;
  sellerName: string;
  sellerWhatsapp?: string;
  reporterName: string;
  reporterContact?: string;
  reporterUserId?: string;
  reason: AdReportReason;
  notes?: string;
}): AdReport {
  const reports = getStoredAdReports();

  const reasonConfig = AD_REPORT_REASONS.find((r) => r.id === params.reason);
  const reasonLabel = reasonConfig ? reasonConfig.label : 'Pelanggaran Iklan';

  const newReport: AdReport = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    listingId: params.listingId,
    listingTitle: params.listingTitle,
    listingPrice: params.listingPrice,
    listingImageUrl: params.listingImageUrl,
    listingLocation: params.listingLocation,
    sellerId: params.sellerId,
    sellerName: params.sellerName,
    sellerWhatsapp: params.sellerWhatsapp,
    reporterName: params.reporterName.trim() || 'Pembeli Terverifikasi',
    reporterContact: params.reporterContact?.trim() || '-',
    reporterUserId: params.reporterUserId,
    reason: params.reason,
    reasonLabel,
    notes: params.notes?.trim() || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const updatedReports = [newReport, ...reports];

  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updatedReports));

    // Kirim event browser lokal agar Dashboard Admin yang sedang terbuka langsung update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('jualrugi_new_ad_report', { detail: newReport })
      );
    }
  } catch (err) {
    console.error('[ReportService] Gagal menyimpan laporan baru:', err);
  }

  return newReport;
}

/**
 * Memperbarui status laporan iklan oleh Admin
 */
export function updateAdReportStatus(
  reportId: string,
  newStatus: AdReport['status'],
  resolutionNotes?: string
): boolean {
  try {
    const reports = getStoredAdReports();
    const updated = reports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          status: newStatus,
          resolvedAt:
            newStatus === 'resolved' || newStatus === 'dismissed'
              ? new Date().toISOString()
              : r.resolvedAt,
          resolutionNotes: resolutionNotes || r.resolutionNotes,
        };
      }
      return r;
    });

    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jualrugi_ad_report_updated'));
    }
    return true;
  } catch (e) {
    console.error('[ReportService] Gagal memperbarui status laporan:', e);
    return false;
  }
}

/**
 * Menghapus laporan iklan dari arsip
 */
export function deleteAdReport(reportId: string): boolean {
  try {
    const reports = getStoredAdReports();
    const filtered = reports.filter((r) => r.id !== reportId);
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(filtered));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jualrugi_ad_report_updated'));
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Menghitung jumlah laporan yang berstatus 'pending' (perlu ditindaklanjuti admin)
 */
export function getPendingReportCount(): number {
  const reports = getStoredAdReports();
  return reports.filter((r) => r.status === 'pending' || r.status === 'investigating').length;
}

/**
 * Memeriksa apakah pembeli saat ini sudah pernah melaporkan iklan ini
 */
export function hasUserReportedListing(listingId: string, reporterUserIdOrEmail?: string): boolean {
  if (!reporterUserIdOrEmail) return false;
  const reports = getStoredAdReports();
  const search = reporterUserIdOrEmail.toLowerCase().trim();
  return reports.some(
    (r) =>
      r.listingId === listingId &&
      (r.reporterUserId === search ||
        r.reporterContact?.toLowerCase().includes(search))
  );
}
