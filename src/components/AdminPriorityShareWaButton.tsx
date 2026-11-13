import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Send, Share2 } from 'lucide-react';

export interface PriorityShareListingInput {
  id?: string | null;
  title?: string | null;
  normalPrice?: number | string | null;
  normal_price?: number | string | null;
  sellingPrice?: number | string | null;
  bu_price?: number | string | null;
  discountPercentage?: number | string | null;
  discount_percentage?: number | string | null;
  location?: string | null;
  cod_location?: string | null;
  category?: string | null;
  condition?: string | null;
  urgentReason?: string | null;
  urgent_reason?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  isSuperBU?: boolean | null;
  is_priority?: boolean | null;
  is_super_bu?: boolean | null;
  seller_name?: string | null;
  seller?: {
    name?: string | null;
  } | null;
}

export interface NormalizedPriorityShareItem {
  id: string;
  title: string;
  normal_price: number;
  bu_price: number;
  discount_percentage: number;
  cod_location: string;
  seller_name: string;
  description: string;
  category: string;
  image_url: string;
  ad_url: string;
}

export interface AdminPriorityShareWaButtonProps {
  listing: PriorityShareListingInput | null | undefined;
  /** Override status prioritas; jika tidak diisi akan membaca isSuperBU / is_priority / is_super_bu */
  isPriorityActive?: boolean;
  /** Tampilkan skeleton loading saat data iklan sedang diambil secara async */
  isLoading?: boolean;
  /** Variasi tampilan: 'compact' (kolom Status) atau 'action' (kolom Aksi) */
  variant?: 'compact' | 'action';
  /** Tampilkan tombol kirim otomatis ke Grup WA via backend proxy Fonnte (/api/send-priority-group-wa) */
  showFonnteGroupButton?: boolean;
  /** Callback opsional saat tombol Share WA diklik */
  onShareSuccess?: (info: { method: 'whatsapp_url' | 'web_share'; url: string; item: NormalizedPriorityShareItem }) => void;
  /** Callback opsional hasil pengiriman backend Fonnte */
  onFonnteResult?: (result: { success: boolean; message: string }) => void;
}

const PRODUCTION_BASE_URL = 'https://jualrugi.my.id';

function toSafeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.round(parsed);
    }
  }
  return 0;
}

function toSafeString(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

/**
 * Normalisasi seluruh field iklan agar tidak pernah undefined/null saat tombol diklik.
 */
export function normalizePriorityListingForShare(
  listing: PriorityShareListingInput | null | undefined
): NormalizedPriorityShareItem {
  const safeId = toSafeString(listing?.id, 'bu-prioritas');
  const safeTitle = toSafeString(listing?.title, 'Produk BU Prioritas');
  const normalPrice = toSafeNumber(listing?.normalPrice ?? listing?.normal_price);
  const buPrice = toSafeNumber(listing?.sellingPrice ?? listing?.bu_price);

  const rawDiscount = listing?.discountPercentage ?? listing?.discount_percentage;
  const parsedDiscount = toSafeNumber(rawDiscount);
  const discountPercentage =
    parsedDiscount > 0
      ? parsedDiscount
      : normalPrice > buPrice && normalPrice > 0
      ? Math.round(((normalPrice - buPrice) / normalPrice) * 100)
      : 0;

  const codLocation = toSafeString(
    listing?.location ?? listing?.cod_location,
    'Indonesia (COD Aman)'
  );
  const sellerName = toSafeString(
    listing?.seller?.name ?? listing?.seller_name,
    'Member JualRugi'
  );
  const category = toSafeString(listing?.category, 'Barang BU Prioritas');

  const explicitDesc = toSafeString(listing?.description, '');
  const conditionText = toSafeString(listing?.condition, '');
  const urgentText = toSafeString(listing?.urgentReason ?? listing?.urgent_reason, '');

  let description = explicitDesc;
  if (!description) {
    if (conditionText && urgentText && conditionText !== urgentText) {
      description = `${conditionText} | Alasan BU: ${urgentText}`;
    } else {
      description = urgentText || conditionText || 'Barang BU Prioritas siap COD hari ini.';
    }
  }

  const rawImageUrl = toSafeString(listing?.imageUrl ?? listing?.image_url, '');

  return {
    id: safeId,
    title: safeTitle,
    normal_price: normalPrice,
    bu_price: buPrice,
    discount_percentage: discountPercentage,
    cod_location: codLocation,
    seller_name: sellerName,
    description,
    category,
    image_url: rawImageUrl,
    ad_url: `${PRODUCTION_BASE_URL}/product/${encodeURIComponent(safeId)}`,
  };
}

/**
 * Menyusun pesan template grup WhatsApp yang bersih dan rapi.
 */
export function formatPriorityWhatsAppMessage(item: NormalizedPriorityShareItem): string {
  const normalPriceStr = item.normal_price.toLocaleString('id-ID');
  const buPriceStr = item.bu_price.toLocaleString('id-ID');

  return [
    '🔥 *BU PRIORITAS - JUAL RUGI* 🔥',
    '',
    'Halo rekan-rekan grup! Ada barang hot deal nih yang baru saja di-approve admin dan langsung diobral rugi cepat! 🚀',
    '',
    `📌 *Judul:* ${item.title}`,
    `💰 *Harga Normal:* Rp ${normalPriceStr}`,
    `⚡ *Harga BU:* *Rp ${buPriceStr}*`,
    `📉 *Diskon:* *${item.discount_percentage}%*`,
    `📍 *Lokasi COD:* ${item.cod_location}`,
    `👤 *Seller:* ${item.seller_name}`,
    '',
    '📝 *Keterangan:*',
    item.description,
    '',
    `🔗 *Link Iklan:* ${item.ad_url}`,
    '',
    '---',
    'Langsung cek iklannya untuk amankan barangnya sekarang! Siapa cepat dia dapat! 🏃💨',
  ].join('\n');
}

/**
 * Menghasilkan URL WhatsApp Share dengan encodeURIComponent penuh
 * agar baris baru (\n), spasi, dan karakter khusus aman di browser mobile & APK.
 */
export function buildPriorityWhatsAppShareUrl(
  listing: PriorityShareListingInput | null | undefined
): string {
  const item = normalizePriorityListingForShare(listing);
  const message = formatPriorityWhatsAppMessage(item);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

const WhatsAppGlyph: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current shrink-0`} aria-hidden="true">
    <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.172.109-1.906-.125-.453-.141-1.031-.328-1.766-.641-3.094-1.344-5.109-4.469-5.266-4.672-.156-.203-1.266-1.688-1.266-3.219s.797-2.281 1.078-2.594c.281-.313.609-.391.813-.391.203 0 .406.016.578.016.188 0 .438-.078.688.531.25.609.859 2.094.938 2.25.078.156.125.344.016.547-.109.203-.156.328-.313.516-.156.188-.328.406-.469.547-.156.156-.313.328-.141.641.172.313.781 1.297 1.672 2.094 1.156 1.031 2.125 1.344 2.438 1.5.313.156.484.125.672-.078.188-.203.781-.906.984-1.219.203-.313.422-.266.703-.156.281.109 1.797.844 2.109 1 .313.156.516.234.594.359.078.125.078.734-.172 1.438z" />
  </svg>
);

export const AdminPriorityShareWaButton: React.FC<AdminPriorityShareWaButtonProps> = ({
  listing,
  isPriorityActive,
  isLoading = false,
  variant = 'action',
  showFonnteGroupButton = false,
  onShareSuccess,
  onFonnteResult,
}) => {
  // 1. Client-side hydration guard (mencegah mismatch antara pre-render / SSR dan CSR)
  const [isMounted, setIsMounted] = useState(false);
  const [isSendingFonnte, setIsSendingFonnte] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true);
    }
  }, []);

  const resolvedPriority =
    typeof isPriorityActive === 'boolean'
      ? isPriorityActive
      : Boolean(listing?.isSuperBU || listing?.is_priority || listing?.is_super_bu);

  const normalizedItem = useMemo(
    () => normalizePriorityListingForShare(listing),
    [listing]
  );

  const shareText = useMemo(
    () => formatPriorityWhatsAppMessage(normalizedItem),
    [normalizedItem]
  );

  const whatsappShareUrl = useMemo(
    () => `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    [shareText]
  );

  // Skeleton fallback saat hydration awal atau data iklan async belum siap
  if (!isMounted || isLoading || !listing) {
    return (
      <div
        aria-hidden="true"
        className={
          variant === 'compact'
            ? 'h-5 w-20 rounded-full bg-emerald-200/70 animate-pulse'
            : 'h-7 w-24 rounded-lg bg-emerald-200/70 animate-pulse'
        }
      />
    );
  }

  if (!resolvedPriority) {
    return null;
  }

  const handleDirectShareClick = () => {
    onShareSuccess?.({
      method: 'whatsapp_url',
      url: whatsappShareUrl,
      item: normalizedItem,
    });
  };

  const handleNativeWebShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `BU Prioritas: ${normalizedItem.title}`,
          text: shareText,
          url: normalizedItem.ad_url,
        });
        onShareSuccess?.({
          method: 'web_share',
          url: normalizedItem.ad_url,
          item: normalizedItem,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    if (typeof window !== 'undefined') {
      window.location.assign(whatsappShareUrl);
    }
  };

  // Integrasi backend proxy Fonnte (/api/send-priority-group-wa) tanpa mengekspos token di client-side
  const handleSendViaFonnteBackend = async () => {
    if (isSendingFonnte) return;
    setIsSendingFonnte(true);
    try {
      const response = await fetch('/api/send-priority-group-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: normalizedItem.id,
          listingTitle: normalizedItem.title,
          sellingPrice: normalizedItem.bu_price,
          normalPrice: normalizedItem.normal_price,
          discountPercentage: normalizedItem.discount_percentage,
          location: normalizedItem.cod_location,
          category: normalizedItem.category,
          urgentReason: normalizedItem.description,
          sellerName: normalizedItem.seller_name,
          adLink: normalizedItem.ad_url,
          imageUrl: normalizedItem.image_url,
          customMessage: shareText,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const ok = response.ok && data?.success !== false;
      onFonnteResult?.({
        success: ok,
        message:
          data?.message ||
          (ok
            ? `Iklan "${normalizedItem.title}" berhasil dikirim ke Grup WA.`
            : 'Gagal mengirim pesan via server Fonnte.'),
      });
    } catch {
      onFonnteResult?.({
        success: false,
        message: 'Koneksi ke endpoint /api/send-priority-group-wa gagal. Gunakan tombol Share WA langsung.',
      });
    } finally {
      setIsSendingFonnte(false);
    }
  };

  if (variant === 'compact') {
    return (
      <a
        href={whatsappShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleDirectShareClick}
        data-testid={`admin-share-wa-compact-${normalizedItem.id}`}
        className="px-2.5 py-0.5 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-2xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1 text-[10px] font-black"
        title="Bagikan iklan BU Prioritas ini via WhatsApp"
      >
        <WhatsAppGlyph className="w-3 h-3" />
        <span>Share WA</span>
      </a>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* Fallback utama bebas CORS & aman di browser mobile maupun APK/PWA */}
      <a
        href={whatsappShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleDirectShareClick}
        data-testid={`admin-share-wa-action-${normalizedItem.id}`}
        className="px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white border border-emerald-600/20 shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-black"
        title="Bagikan iklan BU Prioritas ini via WhatsApp (Auto-Fill Template)"
      >
        <WhatsAppGlyph className="w-3.5 h-3.5" />
        <span>Share WA</span>
      </a>

      {/* Opsional: Web Share API native untuk HP Android/iOS yang mendukung */}
      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <button
          type="button"
          onClick={handleNativeWebShare}
          className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
          title="Bagikan lewat menu Share bawaan HP"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Opsional: Kirim otomatis ke Grup WA melalui server proxy /api/send-priority-group-wa */}
      {showFonnteGroupButton && (
        <button
          type="button"
          onClick={handleSendViaFonnteBackend}
          disabled={isSendingFonnte}
          data-testid={`admin-fonnte-group-action-${normalizedItem.id}`}
          className="px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer flex items-center gap-1 text-[10px] font-black disabled:opacity-60"
          title="Teruskan otomatis ke Grup WhatsApp via Server Fonnte"
        >
          {isSendingFonnte ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
          <span>Grup WA</span>
        </button>
      )}
    </div>
  );
};
