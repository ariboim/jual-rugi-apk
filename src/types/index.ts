export type Category =
  | 'Smartphone & Gadget'
  | 'Laptop & Komputer'
  | 'Elektronik Rumah Tangga'
  | 'Sepeda Motor';

export const CATEGORIES: Category[] = [
  'Smartphone & Gadget',
  'Laptop & Komputer',
  'Elektronik Rumah Tangga',
  'Sepeda Motor',
];

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  location: string;
  codVerified: boolean;
  rating: number;
  dealsCompleted: number;
  joinedDate: string;
  phoneMasked: string;
}

export interface PhotoAngle {
  url: string;
  label: string; // e.g. Tampak Depan, Tampak Belakang, Sisi Samping, Detail Minus
  description?: string;
}

/**
 * Interface data foto produk jualrugi.id
 * Format data array yang digunakan:
 * [
 *   { id: '1', url: 'https://...', caption: 'Tampak depan layar nyala mulus' },
 *   { id: '2', url: 'https://...', caption: 'Bagian belakang dan modul kamera' }
 * ]
 */
export interface ProductPhoto {
  id: string;
  url: string;
  caption?: string;
  file?: File;
  label?: string;
  description?: string;
}

export interface Listing {
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
  images?: string[];
  photoAngles?: PhotoAngle[];
  photos?: ProductPhoto[];
  isSuperBU: boolean;
  superBUExpiresAt?: string;
  sundulAt?: string;
  createdAt: string; // ISO string for sorting & "Sundul"
  seller: Seller;
  aiVerified: boolean;
  aiVerificationReason: string;
  views: number;
  savedCount: number;
  views_count?: number;
  favorites_count?: number;
}

export interface ChatMessage {
  id: string;
  listingId: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller';
  text: string;
  timestamp: string;
  hasSensitiveWarning?: boolean;
  isCodProposal?: boolean;
  codLocation?: string;
}

export interface UserPermissions {
  locationGranted: boolean;
  cameraGalleryGranted: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'buyer' | 'seller';
  avatar: string;
  email: string;
  phone: string;
  city: string;
  // Quota & Monetization tracking
  freeListingUsed: boolean;
  listingQuota: number;
  activeListingCount: number;
  permissions?: UserPermissions;
}

export type MonetizationPackage = 'sundul' | 'prioritas_bu';

export interface MayarProductConfig {
  id: MonetizationPackage;
  name: string;
  price: number; // 25000 or 75000
  paymentUrl: string;
  description: string;
  features: string[];
}

export interface MayarTransaction {
  id: string;
  transactionId: string;
  userId: string;
  listingId?: string;
  packageType: MonetizationPackage;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

export interface MayarWebhookPayload {
  event: 'payment.received' | 'transaction.paid';
  data: {
    id: string;
    transaction_id: string;
    amount: number;
    status: string;
    customer_email: string;
    customer_name?: string;
    metadata?: {
      userId: string;
      listingId?: string;
      packageType: MonetizationPackage;
    };
    created_at: string;
  };
}
