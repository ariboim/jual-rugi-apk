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
  isSuperBU: boolean;
  superBUExpiresAt?: string;
  createdAt: string; // ISO string for sorting & "Sundul"
  seller: Seller;
  aiVerified: boolean;
  aiVerificationReason: string;
  views: number;
  savedCount: number;
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

export interface UserProfile {
  id: string;
  name: string;
  role: 'buyer' | 'seller';
  avatar: string;
  email: string;
  phone: string;
  city: string;
}
