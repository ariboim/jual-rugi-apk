/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  Search,
  MapPin,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Laptop,
  Tv,
  Bike,
  X,
  CheckCircle2,
  LogOut,
  Clock,
  BellRing,
  Mail,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  Tag,
} from 'lucide-react';

import { Category, CATEGORIES, Listing, UserProfile, MonetizationPackage } from './types';
import {
  scheduleModerationPushNotification,
  sendSystemPushNotification,
  getPendingModerations,
} from './services/notificationService';
import {
  triggerAdPublishedEmail,
  triggerQuotaActivatedEmail,
  getDynamicAdLink,
} from './services/adPublishedEmailService';
import { INITIAL_LISTINGS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { ListingCard } from './components/ListingCard';
import { ListingDetailModal } from './components/ListingDetailModal';
import { PostListingModal } from './components/PostListingModal';
import { EditListingModal } from './components/EditListingModal';
import { EditModerationModal } from './components/EditModerationModal';
import { ChatModal } from './components/ChatModal';
import { QRISModal, MonetizationType } from './components/QRISModal';
import { SellerDashboard } from './components/SellerDashboard';
import { CODSafetyGuideModal } from './components/CODSafetyGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CategoryFilter } from './components/CategoryFilter';
import { PromoBannerModal } from './components/PromoBannerModal';
import { TopPromoBanner } from './components/TopPromoBanner';
import { AuthModal } from './components/AuthModal';
import { InFeedBanner } from './components/InFeedBanner';
import { LocationPermissionModal } from './components/LocationPermissionModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { PanduanPDFModal } from './components/PanduanPDFModal';
import { LiveActivityTicker } from './components/LiveActivityTicker';
import { WelcomeEmailSetupModal } from './components/WelcomeEmailSetupModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { BuyQuotaModal } from './components/BuyQuotaModal';
import { Footer } from './components/Footer';
import { updateStoredUserQuota, getActiveOrLatestUser, findStoredUser, getStoredUsers } from './services/userService';
import { ADMIN_TEST_PRESETS, AdminTestPreset } from './data/adminTestPresets';
import {
  fetchListingsFromSupabase,
  fetchListingByIdFromSupabase,
  saveListingToSupabase,
  updateListingInSupabase,
  deleteListingFromSupabase,
  isSupabaseConfigured,
} from './services/supabase';
import {
  checkAndExpireListings,
  DAILY_SOLD_SEEDED_LISTINGS,
} from './services/listingLifecycle';

// User simulation profiles with Quota & Permissions
const GUEST_USER: UserProfile = {
  id: 'guest',
  name: 'Tamu JualRugi',
  role: 'buyer',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  email: '',
  phone: '',
  city: 'Jakarta Selatan',
  freeListingUsed: false,
  listingQuota: 1,
  activeListingCount: 0,
  permissions: {
    locationGranted: false,
    cameraGalleryGranted: false,
  },
};

const BUYER_USER: UserProfile = {
  id: 'buyer-rian',
  name: 'Rian Pratama',
  role: 'buyer',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  email: 'rian.pratama@gmail.com',
  phone: '0812-9988-7766',
  city: 'Jakarta Selatan',
  freeListingUsed: false,
  listingQuota: 1, // 1 free listing for new signup
  activeListingCount: 0,
  permissions: {
    locationGranted: false,
    cameraGalleryGranted: false,
  },
};

const SELLER_USER: UserProfile = {
  id: 'seller-agus',
  name: 'Agus Setiawan',
  role: 'seller',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  email: 'agus.setiawan@gmail.com',
  phone: '0812-8899-1234',
  city: 'Jakarta Selatan',
  freeListingUsed: true,
  listingQuota: 0, // Used initial quota, needs promotion boost
  activeListingCount: 1,
  permissions: {
    locationGranted: true,
    cameraGalleryGranted: true,
  },
};

export default function App() {
  const [listings, setListings] = useState<Listing[]>(() => {
    try {
      const saved = localStorage.getItem('jualrugi_listings');
      let base: Listing[] = [];
      if (saved) {
        const parsed: Listing[] = JSON.parse(saved);
        base = parsed.map((item) => {
          let updatedItem = {
            ...item,
            title: item.title.replace(/\bThinQ AI\b/g, 'ThinQ'),
          };
          if (item.id === 'bu-006' || item.imageUrl.includes('1584992236310-6edddc08acff')) {
            const freshBu006 = INITIAL_LISTINGS.find((l) => l.id === 'bu-006');
            if (freshBu006) {
              updatedItem = {
                ...updatedItem,
                imageUrl: freshBu006.imageUrl,
                photoAngles: freshBu006.photoAngles,
              };
            }
          }
          return updatedItem;
        });
      } else {
        base = [...INITIAL_LISTINGS];
      }

      // Aturan Bisnis 4: Auto-seeding minimal 3 produk second sold/terjual organik
      const existingIds = new Set(base.map((item) => item.id));
      const seededToAdd = DAILY_SOLD_SEEDED_LISTINGS.filter((item) => !existingIds.has(item.id));
      const combined = [...base, ...seededToAdd];

      // Aturan Bisnis 1: Cek durasi tayang 30 hari
      const { updatedListings } = checkAndExpireListings(combined);
      return updatedListings;
    } catch (e) {
      console.error(e);
      return [...INITIAL_LISTINGS, ...DAILY_SOLD_SEEDED_LISTINGS];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('jualrugi_listings', JSON.stringify(listings));
    } catch (e) {
      console.error(e);
    }
  }, [listings]);

  // Sinkronisasi data iklan dari Supabase Online saat aplikasi dimuat
  useEffect(() => {
    let isMounted = true;
    async function loadOnlineListings() {
      if (isSupabaseConfigured()) {
        try {
          const onlineData = await fetchListingsFromSupabase();
          if (isMounted && onlineData && onlineData.length > 0) {
            const { updatedListings } = checkAndExpireListings(onlineData);
            const existingIds = new Set(updatedListings.map((item) => item.id));
            const seededToAdd = DAILY_SOLD_SEEDED_LISTINGS.filter((item) => !existingIds.has(item.id));
            setListings([...updatedListings, ...seededToAdd]);
            console.log('⚡ Sinkronisasi Supabase berhasil:', updatedListings.length, 'iklan aktif');
          }
        } catch (e) {
          console.warn('Gagal sinkronisasi data dari Supabase:', e);
        }
      }
    }
    loadOnlineListings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Filter & Search state
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [minDiscountFilter, setMinDiscountFilter] = useState<number>(0);
  const [sortOption, setSortOption] = useState<'urgent' | 'discount' | 'price_low' | 'newest'>('urgent');

  // Modal states
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [activeChatListing, setActiveChatListing] = useState<Listing | null>(null);
  const [chatInitialOffer, setChatInitialOffer] = useState<string | undefined>(undefined);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSafetyGuideOpen, setIsSafetyGuideOpen] = useState(false);

  // Auto-detect and open listing if accessed via WhatsApp deep link (?deal=listing-id or #deal-listing-id)
  useEffect(() => {
    const handleCheckDeepLink = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const path = window.location.pathname.toLowerCase();

        // Check category query param or pathname
        const categoryParam = params.get('category');
        if (
          categoryParam === 'smartphone' ||
          categoryParam === 'handphone' ||
          path.includes('/kategori/smartphone') ||
          path.includes('/kategori/handphone')
        ) {
          setSelectedCategory('Smartphone & Gadget');
        }

        // Check direct link ke form pasang iklan (#pasangiklan, #pasang-iklan, ?action=post, ?tab=post, /pasang-iklan)
        const currentHash = (window.location.hash || '').toLowerCase();
        const isPostAction =
          currentHash === '#pasangiklan' ||
          currentHash === '#pasang-iklan' ||
          currentHash === '#post' ||
          currentHash.includes('pasangiklan') ||
          params.get('action') === 'post' ||
          params.get('tab') === 'post' ||
          params.has('pasang-iklan') ||
          params.has('pasangiklan') ||
          path.includes('/pasang-iklan') ||
          path.includes('/pasangiklan') ||
          path.includes('/post');

        if (isPostAction) {
          setIsPostModalOpen(true);
        }

        // Check direct link ke dashboard admin (?admin=true, #admin, /admin)
        const isAdminAction =
          params.get('admin') === 'true' ||
          params.get('mode') === 'admin' ||
          window.location.hash === '#admin' ||
          path === '/admin' ||
          path.startsWith('/admin/');

        if (isAdminAction) {
          setIsAdminModalOpen(true);
        }

        // Check direct link login/masuk dari notifikasi WhatsApp (misal: https://jualrugi.my.id/login atau /login?email=...)
        const isLoginAction =
          path === '/login' ||
          path.startsWith('/login/') ||
          path === '/masuk' ||
          path.startsWith('/masuk/') ||
          currentHash === '#login' ||
          currentHash === '#masuk' ||
          params.get('action') === 'login' ||
          params.get('tab') === 'login';

        if (isLoginAction) {
          const queryUserIdent =
            params.get('email') ||
            params.get('nama') ||
            params.get('name') ||
            params.get('phone') ||
            params.get('wa') ||
            params.get('u');

          let matchedUser = queryUserIdent ? findStoredUser(queryUserIdent) : null;
          if (!matchedUser) {
            matchedUser = getActiveOrLatestUser();
          }

          if (matchedUser) {
            const userProfile: UserProfile = {
              id: matchedUser.id,
              name: matchedUser.name,
              role: matchedUser.role || 'buyer',
              avatar:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              email: matchedUser.email,
              phone: matchedUser.whatsapp || matchedUser.phone || '',
              whatsapp: matchedUser.whatsapp || matchedUser.phone || '',
              city: matchedUser.city || 'Jakarta Selatan',
              freeListingUsed: false,
              listingQuota: matchedUser.listingQuota ?? 1,
              activeListingCount: 0,
              permissions: {
                locationGranted: false,
                cameraGalleryGranted: false,
              },
            };
            setCurrentUser(userProfile);
            setIsLoggedIn(true);
            try {
              localStorage.setItem('jualrugi_is_logged_in', 'true');
              localStorage.setItem('jualrugi_current_user', JSON.stringify(userProfile));
              if (userProfile.email) {
                localStorage.setItem('jualrugi_last_registered_email', userProfile.email);
              }
            } catch (e) {
              console.error(e);
            }
            setActiveTab('account');
            showToast(`🎉 Halo ${matchedUser.name}! Anda otomatis masuk ke akun.`);
          } else {
            setActiveTab('account');
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }
        }

        // Resolusi ID Iklan: mendukung ?id=, ?deal=, ?ad=, ?iklan=, #deal-, #iklan-, #ad-, serta path /iklan/:id
        let dealId = params.get('id') || params.get('deal') || params.get('ad') || params.get('iklan') || '';
        if (!dealId && window.location.hash) {
          if (window.location.hash.startsWith('#deal-')) {
            dealId = window.location.hash.replace(/^#deal-/, '');
          } else if (window.location.hash.startsWith('#iklan-')) {
            dealId = window.location.hash.replace(/^#iklan-/, '');
          } else if (window.location.hash.startsWith('#ad-')) {
            dealId = window.location.hash.replace(/^#/, '');
          }
        }
        if (!dealId) {
          const matchPath = window.location.pathname.match(/\/iklan\/([^\/\?#]+)/i);
          if (matchPath && matchPath[1]) {
            dealId = decodeURIComponent(matchPath[1]);
          }
        }

        if (dealId) {
          const cleanId = dealId.trim().toLowerCase();
          let match = listings.find((item) => item.id.toLowerCase() === cleanId);
          if (!match) {
            try {
              const raw = localStorage.getItem('jualrugi_listings');
              if (raw) {
                const parsed: Listing[] = JSON.parse(raw);
                match = parsed.find((item) => item.id.toLowerCase() === cleanId);
              }
            } catch (e) {
              console.error(e);
            }
          }
          if (!match) {
            match = INITIAL_LISTINGS.find((item) => item.id.toLowerCase() === cleanId) ||
                    DAILY_SOLD_SEEDED_LISTINGS.find((item) => item.id.toLowerCase() === cleanId);
          }
          if (match) {
            setSelectedListing(match);
          } else if (isSupabaseConfigured()) {
            // Ambil langsung dari database Supabase jika belum termuat di memori browser
            fetchListingByIdFromSupabase(dealId.trim()).then((remoteListing) => {
              if (remoteListing) {
                setSelectedListing(remoteListing);
                setListings((prev) => {
                  if (prev.some((p) => p.id === remoteListing.id)) return prev;
                  return [remoteListing, ...prev];
                });
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to parse deal deep link', err);
      }
    };

    handleCheckDeepLink();
    window.addEventListener('popstate', handleCheckDeepLink);
    window.addEventListener('hashchange', handleCheckDeepLink);
    return () => {
      window.removeEventListener('popstate', handleCheckDeepLink);
      window.removeEventListener('hashchange', handleCheckDeepLink);
    };
  }, [listings]);

  const handleOpenListing = (listing: Listing) => {
    setSelectedListing(listing);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('deal', listing.id);
      window.history.pushState({ dealId: listing.id }, '', url.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseListing = () => {
    setSelectedListing(null);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('deal')) {
        url.searchParams.delete('deal');
        window.history.pushState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // State favorit pengguna disimpan lokal di browser
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jualrugi_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Handler penambahan view counter otomatis saat iklan dibuka
  const handleIncrementView = (listingId: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId
          ? {
              ...item,
              views: (item.views || 0) + 1,
              views_count: (item.views_count ?? item.views ?? 0) + 1,
            }
          : item
      )
    );
    setSelectedListing((prev) =>
      prev && prev.id === listingId
        ? {
            ...prev,
            views: (prev.views || 0) + 1,
            views_count: (prev.views_count ?? prev.views ?? 0) + 1,
          }
        : prev
    );
  };

  // Handler toggle favorit (tambah / kurangi counter favorit)
  const handleToggleFavorite = (listingId: string) => {
    const isFav = favoriteIds.includes(listingId);
    const nextFavs = isFav
      ? favoriteIds.filter((id) => id !== listingId)
      : [...favoriteIds, listingId];

    setFavoriteIds(nextFavs);
    try {
      localStorage.setItem('jualrugi_favorites', JSON.stringify(nextFavs));
    } catch (e) {
      console.error(e);
    }

    const delta = isFav ? -1 : 1;
    setListings((prev) =>
      prev.map((item) => {
        if (item.id === listingId) {
          const currentCount = item.favorites_count ?? item.savedCount ?? 0;
          const newCount = Math.max(0, currentCount + delta);
          return {
            ...item,
            savedCount: newCount,
            favorites_count: newCount,
          };
        }
        return item;
      })
    );

    setSelectedListing((prev) => {
      if (prev && prev.id === listingId) {
        const currentCount = prev.favorites_count ?? prev.savedCount ?? 0;
        const newCount = Math.max(0, currentCount + delta);
        return {
          ...prev,
          savedCount: newCount,
          favorites_count: newCount,
        };
      }
      return prev;
    });

    showToast(isFav ? 'Dihapus dari favorit' : '❤️ Disimpan ke favorit');
  };

  // Monetization QRIS modal state
  const [isQRISModalOpen, setIsQRISModalOpen] = useState(false);
  const [qrisListing, setQrisListing] = useState<Listing | null>(null);
  const [qrisType, setQrisType] = useState<MonetizationType>('sundul');
  const [isBuyQuotaModalOpen, setIsBuyQuotaModalOpen] = useState(false);

  // User Profile state (Prioritas: User Login/Registrasi Asli -> Dummy Default)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      if (localStorage.getItem('jualrugi_is_logged_in') === 'false') {
        return GUEST_USER;
      }
      const savedUserStr = localStorage.getItem('jualrugi_current_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.name && parsed.name !== 'Rian Pratama' && parsed.id !== 'guest') {
          return parsed;
        }
      }
      // Ambil user riil yang baru didaftarkan (seperti hardjasasmita)
      const realUser = getActiveOrLatestUser();
      if (realUser) {
        return {
          id: realUser.id,
          name: realUser.name,
          role: realUser.role || 'buyer',
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          email: realUser.email,
          phone: realUser.whatsapp || realUser.phone || '',
          whatsapp: realUser.whatsapp || realUser.phone || '',
          city: realUser.city || 'Jakarta Selatan',
          freeListingUsed: false,
          listingQuota: realUser.listingQuota ?? 1,
          activeListingCount: 0,
          permissions: {
            locationGranted: false,
            cameraGalleryGranted: false,
          },
        };
      }
      if (savedUserStr) {
        return JSON.parse(savedUserStr);
      }
    } catch {}
    return BUYER_USER;
  });

  // Approval Push Notification Banner
  const [aiApprovalNotification, setAiApprovalNotification] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State Simulasi Push Notifikasi Moderasi (Jeda 2-3 Menit)
  const [pendingModeration, setPendingModeration] = useState<{
    id: string;
    title: string;
    category: string;
    triggerAt: number;
    isEdit?: boolean;
  } | null>(null);

  const [adApprovedNotification, setAdApprovedNotification] = useState<{
    title: string;
    body: string;
    viaPush: boolean;
    listingTitle: string;
    listingId: string;
    adLink: string;
    emailSentTo?: string;
  } | null>(null);

  // State Edit Iklan Pemasang
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isEditListingModalOpen, setIsEditListingModalOpen] = useState(false);
  const [editModerationNotice, setEditModerationNotice] = useState<{
    isOpen: boolean;
    listing: Listing | null;
  }>({ isOpen: false, listing: null });
  const [adLinkCopied, setAdLinkCopied] = useState(false);

  // Interactive Vertical Opening Promo Banner (image_3.png) & Auth Modal state
  const [isPromoBannerOpen, setIsPromoBannerOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('jualrugi_banner_seen') !== 'true';
    } catch {
      return true;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isPanduanModalOpen, setIsPanduanModalOpen] = useState(false);
  const [isWelcomeEmailModalOpen, setIsWelcomeEmailModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname.toLowerCase();
      return (
        params.get('admin') === 'true' ||
        params.get('mode') === 'admin' ||
        window.location.hash === '#admin' ||
        pathname === '/admin' ||
        pathname.startsWith('/admin/')
      );
    } catch {
      return false;
    }
  });

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jualrugi_blocked_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [postInitialPreset, setPostInitialPreset] = useState<AdminTestPreset | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('jualrugi_is_logged_in');
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  const handleClosePromoBanner = () => {
    setIsPromoBannerOpen(false);
    try {
      sessionStorage.setItem('jualrugi_banner_seen', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const handlePromoBannerAction = () => {
    handleClosePromoBanner();
    handleNavigateSmartphoneCategory();
    if (!isLoggedIn) {
      setAuthModalMode('register');
      setIsAuthModalOpen(true);
    } else {
      showToast('🔥 Menampilkan katalog Smartphone & Gadget diskon sadis hari ini!');
    }
  };

  const handleOpenLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  // Membuka modal konfirmasi keluar (100% bebas dari batasan window.confirm di iframe)
  const handlePromptLogout = () => {
    setIsLogoutModalOpen(true);
  };

  // Konfirmasi logout dari dialog in-app
  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    setIsLoggedIn(false);
    setCurrentUser(GUEST_USER);
    try {
      localStorage.setItem('jualrugi_is_logged_in', 'false');
      localStorage.removeItem('jualrugi_current_user');
      localStorage.removeItem('jualrugi_last_registered_email');
    } catch (e) {
      console.error(e);
    }
    showToast('👋 Anda telah berhasil keluar dari akun.');
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    try {
      localStorage.setItem('jualrugi_is_logged_in', 'true');
      localStorage.setItem('jualrugi_current_user', JSON.stringify(user));
      if (user.email) {
        localStorage.setItem('jualrugi_last_registered_email', user.email);
      }
    } catch (e) {
      console.error(e);
    }
    showToast(`🎉 Berhasil masuk sebagai ${user.name}!`);

    // Aturan Onboarding Lokasi: Cek status izin Geolocation API setelah pendaftaran
    if (!user.permissions?.locationGranted) {
      setTimeout(() => {
        setIsLocationModalOpen(true);
      }, 600);
    }
  };

  const handleSwitchUser = () => {
    setCurrentUser((prev) => (prev.id === BUYER_USER.id ? SELLER_USER : BUYER_USER));
    showToast(`Beralih profil ke: ${currentUser.id === BUYER_USER.id ? SELLER_USER.name + ' (Seller)' : BUYER_USER.name + ' (Buyer)'}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Aturan Bisnis 1 & 3: Cek masa kedaluwarsa 30 hari & pengembalian kuota iklan otomatis (+1 slot)
  useEffect(() => {
    const { updatedListings, expiredListings, refundCount } = checkAndExpireListings(
      listings,
      currentUser.id
    );

    if (expiredListings.length > 0) {
      setListings(updatedListings);
    }

    if (refundCount > 0) {
      setCurrentUser((prev) => ({
        ...prev,
        listingQuota: prev.listingQuota + refundCount,
      }));
      showToast(
        `🎁 Kuota pasang iklan Anda dikembalikan (+${refundCount} slot) karena masa tayang iklan telah mencapai 30 hari.`
      );
    }
  }, [currentUser.id]);

  // Navigasi cepat saat banner in-feed diklik
  const handleNavigateSmartphoneCategory = () => {
    setSelectedCategory('Smartphone & Gadget');
    setActiveTab('home');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('category', 'smartphone');
      window.history.pushState({ category: 'smartphone' }, '', url.toString());
    } catch (e) {
      console.error(e);
    }
    showToast('📱 Menampilkan katalog Smartphone & Gadget harga sadis!');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleListingApproved = (newListing: Listing) => {
    setListings((prev) => [newListing, ...prev]);

    // Simpan otomatis ke Supabase database online
    saveListingToSupabase(newListing, currentUser.email, currentUser.phone);

    // Potong 1 Kuota Listing User (Aturan Kuota Listing Aktif)
    setCurrentUser((prev) => ({
      ...prev,
      freeListingUsed: true,
      listingQuota: Math.max(0, prev.listingQuota - 1),
      activeListingCount: (prev.activeListingCount || 0) + 1,
    }));

    // Simulasi trigger waktu tunda 2-3 menit (150 detik = 2.5 menit)
    const delayMs = 150000;
    setPendingModeration({
      id: newListing.id,
      title: newListing.title,
      category: newListing.category,
      triggerAt: Date.now() + delayMs,
      isEdit: false,
    });

    scheduleModerationPushNotification(
      newListing.id,
      newListing.title,
      newListing.category,
      delayMs,
      async ({ title, body, viaPush }) => {
        setPendingModeration(null);
        const dynamicUrl = getDynamicAdLink(newListing.id);
        const recipient =
          currentUser.email && currentUser.email.includes('@')
            ? currentUser.email
            : 'bca.ccpl@gmail.com';

        // 1. Eksekusi pengiriman double notifikasi otomatis "Iklan Tayang" (Email Brevo + WA Fonnte)
        await triggerAdPublishedEmail({
          listingId: newListing.id,
          listingTitle: newListing.title,
          recipientEmail: recipient,
          recipientPhone: currentUser.phone || currentUser.whatsapp,
          whatsapp: currentUser.phone || currentUser.whatsapp,
          recipientName: currentUser.name || 'Admin Tester',
          sellingPrice: newListing.sellingPrice,
          category: newListing.category,
          subject: 'Iklan Tayang',
          isEdit: false,
        });

        // Juga kirim tembusan ke email admin resmi bca.ccpl@gmail.com jika berbeda
        if (recipient !== 'bca.ccpl@gmail.com') {
          triggerAdPublishedEmail({
            listingId: newListing.id,
            listingTitle: newListing.title,
            recipientEmail: 'bca.ccpl@gmail.com',
            recipientName: 'Admin JualRugi',
            sellingPrice: newListing.sellingPrice,
            category: newListing.category,
            subject: 'Iklan Tayang',
            isEdit: false,
          });
        }

        // 2. Set banner notifikasi lengkap dengan link dinamis
        setAdApprovedNotification({
          title: 'Selamat, iklan Anda telah tayang!',
          body: `Selamat, iklan "${newListing.title}" telah resmi aktif tayang di JualRugi.my.id.`,
          viaPush,
          listingTitle: newListing.title,
          listingId: newListing.id,
          adLink: dynamicUrl,
          emailSentTo: recipient,
        });

        showToast(`✉️ Email & WA notifikasi "Iklan Tayang" terkirim ke ${recipient}`);
      }
    );

    setActiveTab('home');
  };

  // Helper untuk memicu notifikasi moderasi seketika (berguna saat pengujian langsung tanpa menunggu 2.5 menit)
  const handleTriggerPendingImmediately = async () => {
    if (!pendingModeration) return;
    const dynamicUrl = getDynamicAdLink(pendingModeration.id);
    const isEditMode = pendingModeration.isEdit === true;
    const recipient =
      currentUser.email && currentUser.email.includes('@')
        ? currentUser.email
        : 'bca.ccpl@gmail.com';

    const noticeTitle = isEditMode
      ? 'Selamat, pembaruan iklan Anda telah tayang!'
      : 'Selamat, iklan Anda telah tayang!';
    const noticeBody = isEditMode
      ? `Selamat, perubahan pada iklan "${pendingModeration.title}" telah selesai dimoderasi dan resmi tayang kembali di JualRugi.my.id.`
      : `Selamat, iklan "${pendingModeration.title}" telah selesai dimoderasi dan resmi tayang di JualRugi.my.id.`;

    const viaPush = await sendSystemPushNotification(
      noticeTitle,
      noticeBody,
      {
        tag: `ad-approved-${pendingModeration.id}`,
        data: { listingId: pendingModeration.id, url: dynamicUrl },
      }
    );

    // Kirim double notifikasi "Iklan Tayang" (Email Brevo + WA Fonnte)
    await triggerAdPublishedEmail({
      listingId: pendingModeration.id,
      listingTitle: pendingModeration.title,
      recipientEmail: recipient,
      recipientPhone: currentUser.phone || currentUser.whatsapp,
      whatsapp: currentUser.phone || currentUser.whatsapp,
      recipientName: currentUser.name || 'Admin Tester',
      category: pendingModeration.category,
      subject: isEditMode ? 'Pembaruan Iklan Tayang' : 'Iklan Tayang',
      isEdit: isEditMode,
    });

    if (recipient !== 'bca.ccpl@gmail.com') {
      triggerAdPublishedEmail({
        listingId: pendingModeration.id,
        listingTitle: pendingModeration.title,
        recipientEmail: 'bca.ccpl@gmail.com',
        recipientName: 'Admin JualRugi',
        category: pendingModeration.category,
        subject: isEditMode ? 'Pembaruan Iklan Tayang' : 'Iklan Tayang',
        isEdit: isEditMode,
      });
    }

    // Kembalikan status listing ke 'active' (resmi tayang)
    setListings((prev) =>
      prev.map((item) => (item.id === pendingModeration.id ? { ...item, status: 'active' } : item))
    );
    setSelectedListing(null);
    updateListingInSupabase(pendingModeration.id, { status: 'active' });

    setAdApprovedNotification({
      title: 'Selamat, iklan Anda telah tayang!',
      body: 'Selamat, iklan Anda telah selesai dimoderasi dan resmi tayang di JualRugi.my.id.',
      viaPush,
      listingTitle: pendingModeration.title,
      listingId: pendingModeration.id,
      adLink: dynamicUrl,
      emailSentTo: recipient,
    });

    showToast(`✉️ Email notifikasi "Iklan Tayang" terkirim ke ${recipient}`);
    setPendingModeration(null);
  };

  // Handler Buka Modal Edit Iklan
  const handleOpenEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setIsEditListingModalOpen(true);
  };

  // Handler Simpan Perubahan Iklan: Reset status ke 'in_moderation' & buka modal "Saya Paham"
  const handleSaveEditedListing = async (updated: Listing) => {
    // 1. Reset status ke mode moderasi: 'in_moderation'
    const moderatedListing: Listing = {
      ...updated,
      status: 'in_moderation',
    };

    // 2. Simpan perubahan data yang baru diinput ke listings state
    setListings((prev) =>
      prev.map((item) => (item.id === moderatedListing.id ? moderatedListing : item))
    );

    // Update selectedListing jika sedang terbuka di detail modal
    setSelectedListing((prev) =>
      prev && prev.id === moderatedListing.id ? moderatedListing : prev
    );

    // 3. Sinkronisasi ke Supabase
    await updateListingInSupabase(moderatedListing.id, {
      status: 'in_moderation',
      title: moderatedListing.title,
      category: moderatedListing.category,
      normal_price: moderatedListing.normalPrice,
      selling_price: moderatedListing.sellingPrice,
      discount_percentage: moderatedListing.discountPercentage,
      location: moderatedListing.location,
      condition: moderatedListing.condition,
      urgent_reason: moderatedListing.urgentReason,
      image_url: moderatedListing.imageUrl,
    });

    // 4. Sembunyikan/tutup form modal edit
    setIsEditListingModalOpen(false);
    setEditingListing(null);

    // 5. Tampilkan Modal Konfirmasi "Saya Paham"
    setEditModerationNotice({
      isOpen: true,
      listing: moderatedListing,
    });
  };

  // Handler saat tombol "Saya Paham" di modal konfirmasi diklik
  const handleConfirmEditModeration = () => {
    const target = editModerationNotice.listing;
    setEditModerationNotice({ isOpen: false, listing: null });

    if (!target) return;

    // 3. Siklus Notifikasi Ulang (Simulasi Jeda Moderasi 2-3 Menit):
    const delayMs = 150000; // 2.5 menit

    setPendingModeration({
      id: target.id,
      title: target.title,
      category: target.category,
      triggerAt: Date.now() + delayMs,
      isEdit: true,
    });

    scheduleModerationPushNotification(
      target.id,
      target.title,
      target.category,
      delayMs,
      async ({ title, body, viaPush }) => {
        setPendingModeration(null);

        // Status kembali menjadi 'active' (tayang)
        setListings((prev) =>
          prev.map((item) => (item.id === target.id ? { ...item, status: 'active' } : item))
        );
        setSelectedListing((prev) =>
          prev && prev.id === target.id ? { ...prev, status: 'active' } : prev
        );
        updateListingInSupabase(target.id, { status: 'active' });

        const dynamicUrl = getDynamicAdLink(target.id);
        const recipient = currentUser.email || 'seller@jualrugi.my.id';

        // Kirim double notifikasi "Iklan Tayang" (Email Brevo + WA Fonnte)
        await triggerAdPublishedEmail({
          listingId: target.id,
          listingTitle: target.title,
          recipientEmail: recipient,
          recipientPhone: currentUser.phone || currentUser.whatsapp,
          whatsapp: currentUser.phone || currentUser.whatsapp,
          recipientName: currentUser.name,
          sellingPrice: target.sellingPrice,
          category: target.category,
          subject: 'Pembaruan Iklan Tayang',
          isEdit: true,
        });

        // Tampilkan push / in-app notification banner
        setAdApprovedNotification({
          title,
          body,
          viaPush,
          listingTitle: target.title,
          listingId: target.id,
          adLink: dynamicUrl,
          emailSentTo: recipient,
        });

        showToast(`✉️ Email & WA notifikasi pembaruan iklan terkirim ke ${recipient}`);
      }
    );
  };

  const handleQRISSuccess = (listingId: string, type: MonetizationType) => {
    const now = new Date().toISOString();
    let updatedTitle = '';

    // Tambah Kuota Posting +1 Slot Iklan Baru (Aturan Monetisasi Mayar)
    setCurrentUser((prev) => ({
      ...prev,
      listingQuota: prev.listingQuota + 1,
    }));

    // Update status prioritas/sundul di Supabase
    updateListingInSupabase(listingId, {
      createdAt: now,
      sundulAt: now,
      isSuperBU: type === 'superbu' || type === 'prioritas_bu',
    });

    setListings((prev) => {
      const idx = prev.findIndex((item) => item.id === listingId);
      if (idx === -1) return prev;

      const target = { ...prev[idx] };
      updatedTitle = target.title;
      target.createdAt = now;
      target.sundulAt = now;

      if (type === 'superbu' || type === 'prioritas_bu') {
        target.isSuperBU = true;
        target.superBUExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      // Move directly to the very top (index 0) of the listings array
      const remaining = prev.filter((item) => item.id !== listingId);
      return [target, ...remaining];
    });

    if (type === 'sundul') {
      showToast('🚀 Pembayaran Mayar Rp 25.000 Berhasil! Iklan Disundul ke #1 & Kuota +1 Slot Aktif!');
    } else {
      showToast('🔥 Pembayaran Mayar Rp 75.000 Berhasil! Highlight Emas Aktif 24 Jam & Kuota +1 Slot Aktif!');
    }

    // Switch to home feed so user immediately sees their listing at the very top
    setActiveTab('home');
  };

  const handleDeleteListing = (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    deleteListingFromSupabase(id);
    showToast('Iklan berhasil dihapus.');
  };

  const handleMarkListingAsSold = (id: string) => {
    const now = new Date().toISOString();
    const cooldownDays = 45;
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const freeQuotaAvailableAt = new Date(Date.now() + cooldownMs).toISOString();

    // 1. Update listing status menjadi 'sold'
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'sold', soldAt: now } : l))
    );
    updateListingInSupabase(id, { status: 'sold', sold_at: now });

    // 2. Update currentUser: TIDAK menambah kuota, aktifkan aturan cooldown 45 hari
    setCurrentUser((prev) => {
      const nextQuota = Math.max(0, (prev.listingQuota || 0) - 1);
      const updated: UserProfile = {
        ...prev,
        freeListingUsed: true,
        listingQuota: nextQuota,
        freeQuotaAvailableAt,
        lastSoldAt: now,
      };
      try {
        localStorage.setItem('jualrugi_current_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast(
      '🎉 Iklan ditandai Terjual! Sesuai aturan, iklan terjual TIDAK menambah kuota. Menunggu 45 hari untuk kuota gratis berikutnya.'
    );

    // 3. Langsung tawarkan opsi beli kuota instan
    setTimeout(() => {
      setIsBuyQuotaModalOpen(true);
    }, 600);
  };

  const handleAddUserQuota = (userId: string, addedQuota: number) => {
    const res = updateStoredUserQuota(userId, addedQuota);

    // Sinkronkan currentUser jika user yang ditambahkan sedang login
    if (
      currentUser.id === userId ||
      (currentUser.email && currentUser.email.toLowerCase() === userId.toLowerCase())
    ) {
      setCurrentUser((prev) => {
        const nextTotal = (prev.listingQuota || 0) + addedQuota;
        const updated: UserProfile = {
          ...prev,
          listingQuota: nextTotal,
          freeQuotaAvailableAt: undefined, // Kuota telah aktif, reset periode tunggu
        };
        try {
          localStorage.setItem('jualrugi_current_user', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Pemicu Double Notifikasi Otomatis 'kuota iklan' via Brevo API & Fonnte WA
      if (currentUser.email) {
        triggerQuotaActivatedEmail({
          recipientEmail: currentUser.email,
          recipientPhone: currentUser.phone || currentUser.whatsapp,
          whatsapp: currentUser.phone || currentUser.whatsapp,
          recipientName: currentUser.name,
          addedQuota,
          newTotalQuota: res.newQuota,
        }).catch(() => {});
      }
    }

    showToast(`✅ Berhasil menambahkan +${addedQuota} kuota iklan! (Total: ${res.newQuota} slot)`);
  };

  const handleToggleBlockUser = (userId: string, isBlocked: boolean) => {
    setBlockedUserIds((prev) => {
      const next = isBlocked
        ? Array.from(new Set([...prev, userId]))
        : prev.filter((id) => id !== userId);
      try {
        localStorage.setItem('jualrugi_blocked_users', JSON.stringify(next));
      } catch (e) {
        console.warn('Gagal menyimpan status blocked user:', e);
      }
      return next;
    });
  };

  const handleAdminToggleSundul = (listingId: string, currentStatus: boolean) => {
    const now = new Date().toISOString();
    const willActivate = !currentStatus;

    setListings((prev) => {
      const idx = prev.findIndex((l) => l.id === listingId);
      if (idx === -1) return prev;
      const target = { ...prev[idx] };
      if (willActivate) {
        target.sundulAt = now;
        target.createdAt = now;
        const remaining = prev.filter((l) => l.id !== listingId);
        return [target, ...remaining];
      } else {
        delete target.sundulAt;
        return prev.map((l) => (l.id === listingId ? target : l));
      }
    });

    updateListingInSupabase(listingId, {
      sundulAt: willActivate ? now : undefined,
      createdAt: willActivate ? now : undefined,
    });
  };

  const handleAdminToggleSuperBU = (listingId: string, currentStatus: boolean) => {
    const willActivate = !currentStatus;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    setListings((prev) =>
      prev.map((l) => {
        if (l.id === listingId) {
          return {
            ...l,
            isSuperBU: willActivate,
            superBUExpiresAt: willActivate ? expiresAt : undefined,
          };
        }
        return l;
      })
    );

    updateListingInSupabase(listingId, {
      isSuperBU: willActivate,
    });
  };

  /**
   * Quick Test Iklan Admin (1-Klik Tayang dengan Foto Fisik Nyata Unsplash)
   * Mengatasi masalah verifikasi gambar: langsung aktifkan status 'active' dan tampilkan ke feed.
   */
  const handleQuickTestAd = (presetIndex: number = 0) => {
    const preset = ADMIN_TEST_PRESETS[presetIndex] || ADMIN_TEST_PRESETS[0];
    const newId = `ad-real-${Date.now()}`;
    const now = new Date().toISOString();

    const newListing: Listing = {
      id: newId,
      title: preset.title,
      category: preset.category,
      normalPrice: preset.normalPrice,
      sellingPrice: preset.sellingPrice,
      discountPercentage: preset.discountPercentage,
      location: preset.location,
      condition: preset.condition,
      urgentReason: preset.urgentReason,
      imageUrl: preset.imageUrl,
      photos: preset.photos,
      photoAngles: preset.photos.map((p) => ({
        url: p.url,
        label: p.label || p.caption || 'Tampak Depan',
        description: p.caption,
      })),
      isSuperBU: false,
      createdAt: now,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      user_id: currentUser.id,
      seller: {
        id: currentUser.id,
        name: currentUser.name || 'Admin Tester',
        avatar: currentUser.avatar,
        location: preset.location,
        codVerified: true,
        rating: 5.0,
        dealsCompleted: 14,
        joinedDate: 'November 2026',
        phoneMasked: currentUser.phone || '0812-9988-7766',
      },
      aiVerified: true,
      aiVerificationReason:
        '✅ Foto fisik asli terverifikasi otentik dari katalog kurasi barang riil JualRugi (Mode Quick Test Admin).',
      views: 1,
      savedCount: 0,
    };

    // Tambahkan iklan ke daftar teratas
    setListings((prev) => [newListing, ...prev]);
    saveListingToSupabase(newListing, currentUser.email, currentUser.phone);

    const dynamicUrl = getDynamicAdLink(newId);
    const targetAdminEmail = 'bca.ccpl@gmail.com';

    // 1. Kirim notifikasi email "Iklan Tayang" ke email admin bca.ccpl@gmail.com
    triggerAdPublishedEmail({
      listingId: newId,
      listingTitle: newListing.title,
      recipientEmail: targetAdminEmail,
      recipientName: 'Admin JualRugi',
      sellingPrice: newListing.sellingPrice,
      category: newListing.category,
      subject: 'Iklan Tayang',
      isEdit: false,
    });

    if (currentUser.email && currentUser.email.includes('@') && currentUser.email !== targetAdminEmail) {
      triggerAdPublishedEmail({
        listingId: newId,
        listingTitle: newListing.title,
        recipientEmail: currentUser.email,
        recipientPhone: currentUser.phone || currentUser.whatsapp,
        whatsapp: currentUser.phone || currentUser.whatsapp,
        recipientName: currentUser.name || 'Pengiklan',
        sellingPrice: newListing.sellingPrice,
        category: newListing.category,
        subject: 'Iklan Tayang',
        isEdit: false,
      });
    }

    // 2. Tampilkan BANNER NOTIFIKASI TAYANG: "Selamat, iklan Anda telah tayang!"
    setAdApprovedNotification({
      title: 'Selamat, iklan Anda telah tayang!',
      body: `Selamat, iklan "${newListing.title}" telah resmi aktif tayang di JualRugi.my.id.`,
      viaPush: true,
      listingTitle: newListing.title,
      listingId: newId,
      adLink: dynamicUrl,
      emailSentTo: targetAdminEmail,
    });

    // 3. Tutup modal detail (jangan langsung membuka Edit Iklan) dan arahkan langsung ke Beranda
    setSelectedListing(null);
    setIsPostModalOpen(false);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showToast(`✅ Notifikasi "Iklan Anda sudah tayang" aktif & email "Iklan Tayang" terkirim ke ${targetAdminEmail}!`);
  };

  const handlePrefillTestAd = (preset: AdminTestPreset) => {
    setSelectedListing(null);
    setPostInitialPreset(preset);
    setIsPostModalOpen(true);
    showToast(`📝 Form Pasang Iklan dibuka dengan preset fisik ${preset.tagLabel}. Silakan uji klik tombol "Pasang Iklan Sekarang" di dalam form.`);
  };

  // Handler perpanjang masa tayang iklan (Ad Expiry Extension: +30 Hari)
  const handleExtendListing = (listing: Listing) => {
    const now = new Date().toISOString();
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    setListings((prev) =>
      prev.map((item) =>
        item.id === listing.id
          ? {
              ...item,
              status: 'active',
              createdAt: now,
              expiresAt: newExpiresAt,
            }
          : item
      )
    );

    setSelectedListing((prev) =>
      prev && prev.id === listing.id
        ? {
            ...prev,
            status: 'active',
            createdAt: now,
            expiresAt: newExpiresAt,
          }
        : prev
    );

    updateListingInSupabase(listing.id, {
      status: 'active',
      createdAt: now,
      expires_at: newExpiresAt,
    });

    showToast('✨ Masa tayang iklan berhasil diperpanjang 30 hari ke depan!');
  };

  // Handler tandai produk terjual langsung oleh seller (Mark as sold)
  const handleMarkAsSold = (listingId: string) => {
    const now = new Date().toISOString();

    setListings((prev) =>
      prev.map((item) =>
        item.id === listingId
          ? {
              ...item,
              status: 'sold',
              soldAt: now,
            }
          : item
      )
    );

    setSelectedListing((prev) =>
      prev && prev.id === listingId
        ? {
            ...prev,
            status: 'sold',
            soldAt: now,
          }
        : prev
    );

    updateListingInSupabase(listingId, {
      status: 'sold',
      sold_at: now,
    });

    showToast('🎉 Iklan berhasil ditandai sebagai TERJUAL (SOLD)!');
  };

  const handleOpenChat = (listing: Listing, initialText?: string) => {
    setSelectedListing(null);
    setActiveChatListing(listing);
    setChatInitialOffer(initialText);
  };

  const handleQuickMakeOffer = (listing: Listing, offerPrice: number) => {
    const text = `Halo kak! Saya minat serius ${listing.title}. Boleh saya tawar di harga Rp ${offerPrice.toLocaleString('id-ID')}? Kalau boleh, kita langsung COD hari ini di tempat ramai.`;
    handleOpenChat(listing, text);
  };

  const handleOpenQRIS = (listing: Listing, type: MonetizationType) => {
    setQrisListing(listing);
    setQrisType(type);
    setIsQRISModalOpen(true);
  };

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    listings.forEach((l) => cities.add(l.location));
    return Array.from(cities);
  }, [listings]);

  // Hitung jumlah listing aktif per kategori untuk filter bar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: listings.length,
      'Smartphone & Gadget': 0,
      'Laptop & Komputer': 0,
      'Elektronik Rumah Tangga': 0,
      'Sepeda Motor': 0,
    };
    listings.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category] += 1;
      }
    });
    return counts;
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // Iklan yang sedang dalam moderasi tidak ditampilkan di feed publik sampai disetujui
        if (item.status === 'in_moderation') {
          return false;
        }
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchLoc = item.location.toLowerCase().includes(q);
          const matchCond = item.condition.toLowerCase().includes(q);
          if (!matchTitle && !matchLoc && !matchCond) return false;
        }
        if (selectedCity && !item.location.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
        if (minDiscountFilter > 0 && item.discountPercentage < minDiscountFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // 1. Most recent sundul timestamp always places an item at the absolute #1 top
        const aSundul = a.sundulAt ? new Date(a.sundulAt).getTime() : 0;
        const bSundul = b.sundulAt ? new Date(b.sundulAt).getTime() : 0;
        if (aSundul > 0 || bSundul > 0) {
          if (aSundul !== bSundul) {
            return bSundul - aSundul;
          }
        }

        // 2. PALING BU (isSuperBU) listings always prioritized at the top of the feed
        if (a.isSuperBU && !b.isSuperBU) return -1;
        if (!a.isSuperBU && b.isSuperBU) return 1;

        if (sortOption === 'discount') {
          return b.discountPercentage - a.discountPercentage;
        }
        if (sortOption === 'price_low') {
          return a.sellingPrice - b.sellingPrice;
        }
        if (sortOption === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [listings, selectedCategory, searchQuery, selectedCity, minDiscountFilter, sortOption]);

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'Smartphone & Gadget':
        return Smartphone;
      case 'Laptop & Komputer':
        return Laptop;
      case 'Elektronik Rumah Tangga':
        return Tv;
      case 'Sepeda Motor':
        return Bike;
    }
  };

  const getCategoryShortName = (cat: Category) => {
    switch (cat) {
      case 'Smartphone & Gadget':
        return 'Smartphone';
      case 'Laptop & Komputer':
        return 'Laptop';
      case 'Elektronik Rumah Tangga':
        return 'Electronic';
      case 'Sepeda Motor':
        return 'Motorcycle';
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f9ff] text-slate-800 flex flex-col font-sans">
      <OfflineIndicator />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenSafetyGuide={() => setIsSafetyGuideOpen(true)}
        onOpenNewListing={() => setIsPostModalOpen(true)}
        onOpenPromoBanner={() => setIsPromoBannerOpen(true)}
        isLoggedIn={isLoggedIn}
        onLogin={handleOpenLogin}
        onLogout={handlePromptLogout}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Active Moderation Tracker Banner (2-3 Menit Jeda Moderasi) */}
      {pendingModeration && (
        <div className="fixed top-24 sm:top-28 left-4 right-4 max-w-xl mx-auto z-50 animate-slide-down">
          <div className="bg-amber-500 text-white px-4 py-3 rounded-2xl shadow-xl shadow-amber-900/20 border-2 border-amber-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-white/20 shrink-0 animate-spin-slow">
                <Clock className="w-5 h-5 text-white" />
              </span>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                  Iklan "{pendingModeration.title}" sedang dimoderasi
                </p>
                <p className="text-[11px] text-amber-100 mt-0.5">
                  Est. 2-3 menit. Notifikasi push sistem akan otomatis muncul di browser/HP Anda.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={handleTriggerPendingImmediately}
                className="px-2.5 py-1.5 bg-white text-amber-700 hover:bg-amber-50 text-[11px] font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                title="Picu notifikasi tayang sekarang tanpa menunggu 2.5 menit"
              >
                ⚡ Tes Notifikasi Sekarang
              </button>
              <button
                onClick={() => setPendingModeration(null)}
                className="p-1 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition cursor-pointer"
                title="Tutup Status Bar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push / In-App & Email Notification Banner saat Iklan Selesai Dimoderasi & Resmi Tayang */}
      {adApprovedNotification && (
        <div className="fixed top-24 sm:top-28 left-4 right-4 max-w-xl mx-auto z-50 animate-slide-down">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-4 sm:p-5 rounded-3xl shadow-2xl shadow-emerald-950/30 border-2 border-emerald-300/40 flex items-start justify-between gap-3 backdrop-blur-md">
            <div className="flex items-start gap-3 grow">
              <span className="p-2.5 rounded-2xl bg-white/20 shrink-0 mt-0.5">
                <BellRing className="w-5 h-5 text-emerald-100 animate-bounce" />
              </span>
              <div className="space-y-2 grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                    {adApprovedNotification.title}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 border border-white/20">
                    {adApprovedNotification.viaPush ? '🔔 Web Push Browser' : '📱 In-App Alert'}
                  </span>
                  {adApprovedNotification.emailSentTo && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 border border-emerald-400/40 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email: "Iklan Tayang"
                    </span>
                  )}
                </div>

                <div className="bg-black/20 rounded-2xl p-3 border border-white/15 space-y-1.5">
                  <p className="text-xs text-white font-medium leading-relaxed">
                    Selamat, iklan Anda telah tayang!
                  </p>
                  <p className="text-[11px] text-emerald-100 leading-snug">
                    Silakan cek iklan Anda melalui link berikut:
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <a
                      href={adApprovedNotification.adLink}
                      onClick={(e) => {
                        e.preventDefault();
                        const found = listings.find((l) => l.id === adApprovedNotification.listingId);
                        if (found) {
                          setSelectedListing(found);
                          setAdApprovedNotification(null);
                        } else {
                          window.open(adApprovedNotification.adLink, '_blank');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-xl border border-white/30 transition truncate max-w-full"
                      title="Klik untuk membuka iklan"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{adApprovedNotification.adLink}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(adApprovedNotification.adLink);
                        setAdLinkCopied(true);
                        setTimeout(() => setAdLinkCopied(false), 2000);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-[11px] font-black flex items-center gap-1 transition shadow-xs cursor-pointer shrink-0"
                    >
                      {adLinkCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {adApprovedNotification.emailSentTo && (
                  <p className="text-[11px] text-emerald-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Notifikasi resmi terkirim ke: <strong className="text-white underline">{adApprovedNotification.emailSentTo}</strong>
                    </span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setAdApprovedNotification(null)}
              className="p-1.5 hover:bg-white/20 rounded-xl text-white/90 hover:text-white shrink-0 cursor-pointer transition active:scale-90"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Legacy/Quick notification fallback if any */}
      {aiApprovalNotification && !adApprovedNotification && (
        <div className="fixed top-24 sm:top-28 left-4 right-4 max-w-xl mx-auto z-50 animate-slide-down">
          <div className="bg-sky-500 text-white px-4 py-3.5 rounded-2xl shadow-xl shadow-sky-900/25 border-2 border-white/40 flex items-center justify-between gap-3 backdrop-blur-sm">
            <div className="flex items-center gap-3 grow">
              <span className="p-1.5 rounded-xl bg-white/20 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </span>
              <div className="text-xs sm:text-sm font-extrabold tracking-normal leading-snug">
                {aiApprovalNotification}
              </div>
            </div>
            <button
              onClick={() => setAiApprovalNotification(null)}
              className="p-1.5 hover:bg-white/20 rounded-xl text-white shrink-0 cursor-pointer transition active:scale-90"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating System Toast (Aman di atas BottomNav tanpa overflow) */}
      {toastMessage && (
        <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 bg-sky-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in border border-sky-400 max-w-[calc(100vw-2rem)]">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="grow">
        {/* TAB: BERANDA (FEED) */}
        {activeTab === 'home' && (
          <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 space-y-4 sm:space-y-5 pb-24 overflow-x-hidden">
            {/* Promo Banner Responsif Tepat di Bawah Header & Sebelum Kategori Pilihan */}
            <TopPromoBanner onNavigateCategory={handleNavigateSmartphoneCategory} />

            {/* Top Category Filter for Rapid Feed Navigation */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
            />

            {/* Sky Blue Themed Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-white p-5 sm:p-7 border border-sky-100 shadow-sm">
              <div className="relative z-10 max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-sky-500 text-sky-500 animate-pulse" />
                  BURSA DISTRESS SALE • 100% COD
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Barang Bekas Murah <span className="text-sky-600">Butuh Uang Cepat</span>.
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Penjual BU dapat dana hari ini, pembeli dapat harga rugi ekstrim. Wajib COD tatap muka di tempat umum ramai tanpa risiko transfer DP!
                </p>

                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  {/* Sky Blue Primary CTA Button */}
                  <button
                    onClick={() => setIsPostModalOpen(true)}
                    className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-sm shadow-sky-500/25 cursor-pointer active:scale-95 transition"
                  >
                    + Jual Barang BU Sekarang
                  </button>
                  <button
                    onClick={() => setIsSafetyGuideOpen(true)}
                    className="py-2.5 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Panduan COD Anti-Tipu</span>
                  </button>
                </div>
              </div>

              {/* Decorative Subtle Accent */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 hidden sm:block pointer-events-none">
                <Flame className="w-48 h-48 text-sky-400" />
              </div>
            </div>

            {/* Quick Search & Filter Bar - Sky & White Palette */}
            <div className="bg-white p-3 rounded-2xl border border-sky-100 shadow-xs flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative grow w-full">
                <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari iPhone, ROG, Beat, Kulkas, atau lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-sky-50/50 border border-sky-200 focus:border-sky-500 text-slate-900 placeholder-slate-400 text-xs outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* City Quick Dropdown */}
              <div className="w-full sm:w-48">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-800 text-xs outline-none cursor-pointer focus:border-sky-500"
                >
                  <option value="">Semua Lokasi COD</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>
                      📍 {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting Filter */}
              <div className="w-full sm:w-48">
                <select
                  value={sortOption}
                  onChange={(e) =>
                    setSortOption(
                      e.target.value as 'urgent' | 'discount' | 'price_low' | 'newest'
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-800 text-xs outline-none cursor-pointer focus:border-sky-500"
                >
                  <option value="urgent">🔥 Super BU Teratas</option>
                  <option value="discount">📉 Diskon Tertinggi</option>
                  <option value="price_low">💰 Harga Termurah</option>
                  <option value="newest">⏱️ Terbaru Masuk</option>
                </select>
              </div>
            </div>

            {/* Categories Quick Pill Selectors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>FILTER KATEGORI FEED:</span>
                <span className="text-[11px] text-slate-500">
                  {filteredListings.length} Iklan Aktif
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* "Semua" pill */}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    selectedCategory === 'all'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs shadow-sky-500/25'
                      : 'bg-white text-slate-700 border-sky-100 hover:border-sky-300'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${selectedCategory === 'all' ? 'text-amber-300' : 'text-sky-500'}`} />
                  <span>Semua</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedCategory === 'all' ? 'bg-sky-400 text-white' : 'bg-sky-50 text-sky-700'
                  }`}>
                    {categoryCounts['all'] || 0}
                  </span>
                </button>

                {/* 4 Categories: Smartphone, Laptop, Electronic, Motorcycle */}
                {CATEGORIES.map((cat) => {
                  const Icon = getCategoryIcon(cat);
                  const isSelected = selectedCategory === cat;
                  const shortName = getCategoryShortName(cat);
                  const count = categoryCounts[cat] || 0;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                      className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs shadow-sky-500/25'
                          : 'bg-white text-slate-700 border-sky-100 hover:border-sky-300'
                      }`}
                      title={`Filter ${shortName} (${cat})`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-sky-500'}`} />
                      <span className="truncate">{shortName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-sky-400 text-white' : 'bg-sky-50 text-sky-700'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Discount Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-slate-500 font-semibold text-[11px] shrink-0">
                Filter Cepat:
              </span>
              {[
                { label: 'Semua Diskon', val: 0 },
                { label: 'Diskon > 35%', val: 35 },
                { label: 'Diskon > 45%', val: 45 },
              ].map((chip) => (
                <button
                  key={chip.val}
                  onClick={() => setMinDiscountFilter(chip.val)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer shrink-0 ${
                    minDiscountFilter === chip.val
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-white text-slate-600 border-sky-100 hover:text-sky-600'
                  }`}
                >
                  {chip.label}
                </button>
              ))}

              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setSelectedCity('');
                  setMinDiscountFilter(0);
                }}
                className="text-[11px] text-slate-500 underline ml-auto shrink-0 cursor-pointer hover:text-sky-600"
              >
                Reset Filter
              </button>
            </div>

            {/* Responsive Product Card Grid */}
            {filteredListings.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-sky-100 space-y-3 shadow-xs">
                <Search className="w-10 h-10 text-sky-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Tidak Ditemukan Iklan yang Sesuai</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian, pilih lokasi lain, atau pasang iklan barang yang Anda cari.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setSelectedCity('');
                    setMinDiscountFilter(0);
                  }}
                  className="py-2 px-4 rounded-xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 cursor-pointer shadow-xs shadow-sky-500/25"
                >
                  Tampilkan Semua Iklan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredListings.map((item, index) => {
                  // Pola OLX: Sisipkan banner setelah item ke-4 (index 3), atau di akhir jika daftar sedikit
                  const shouldRenderBanner =
                    index === 3 ||
                    (filteredListings.length < 4 &&
                      index === filteredListings.length - 1 &&
                      selectedCategory !== 'Smartphone & Gadget');

                  return (
                    <React.Fragment key={item.id}>
                      <ListingCard
                        listing={item}
                        onClick={() => handleOpenListing(item)}
                        onQuickChat={(e) => {
                          e.stopPropagation();
                          handleOpenChat(item);
                        }}
                      />

                      {/* Banner Iklan In-Feed Horizontal (Pola Layout Feed OLX) */}
                      {shouldRenderBanner && (
                        <InFeedBanner
                          imageUrl="/assets/aistudio/banner-hp-jualrugi.png"
                          targetUrl="/search?category=smartphone"
                          badgeText="Pusatnya HP Butuh Uang"
                          onClick={handleNavigateSmartphoneCategory}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: CARI & FILTER */}
        {activeTab === 'search' && (
          <div className="max-w-3xl mx-auto px-4 py-5 space-y-5 pb-24 text-slate-800">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-sky-950">Pencarian Barang Distress Sale</h2>
              <p className="text-xs text-slate-500">Temukan barang murah Butuh Uang di kota Anda</p>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-sky-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Ketik tipe hp, laptop, motor, kulkas, kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-sky-200 focus:border-sky-500 text-slate-900 placeholder-slate-400 text-sm outline-none shadow-xs"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Pilih Kategori:</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = getCategoryIcon(cat);
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() =>
                        setSelectedCategory((prev) => (prev === cat ? 'all' : cat))
                      }
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs shadow-sky-500/25'
                          : 'bg-white text-slate-700 border-sky-100 hover:border-sky-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-sky-500" />
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* City Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Kota Lokasi COD:</label>
              <div className="flex flex-wrap gap-2">
                {['Jakarta', 'Bekasi', 'Bandung', 'Surabaya', 'Tangerang', 'Depok', 'Semarang'].map(
                  (city) => (
                    <button
                      key={city}
                      onClick={() =>
                        setSelectedCity((prev) => (prev === city ? '' : city))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        selectedCity === city
                          ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                          : 'bg-white text-slate-600 border-sky-100 hover:border-sky-300'
                      }`}
                    >
                      📍 {city}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Results Button - Sky Blue */}
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('home')}
                className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm shadow-md shadow-sky-500/25 cursor-pointer transition active:scale-98"
              >
                Lihat {filteredListings.length} Hasil Iklan BU
              </button>
            </div>
          </div>
        )}

        {/* TAB: PASANG IKLAN */}
        {activeTab === 'post' && (
          <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4 pb-24 text-slate-800">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto shadow-xs">
              <Flame className="w-8 h-8 fill-sky-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-sky-950">Pasang Iklan Butuh Uang (BU)</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Semua iklan wajib lolos <strong>Inspeksi Moderasi Produk</strong> untuk memverifikasi foto fisik asli dan diskon wajar.
            </p>
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="py-3 px-6 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-sm shadow-md shadow-sky-500/25 cursor-pointer"
            >
              Buka Form Pasang Iklan
            </button>
          </div>
        )}

        {/* TAB: CHAT DIRECT (P2P) */}
        {activeTab === 'chat' && (
          <div className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-24 text-slate-800">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-sky-950">Percakapan P2P Langsung</h2>
              <p className="text-xs text-slate-500">
                Pilih iklan aktif untuk mulai obrolan & negosiasi titik temu COD
              </p>
            </div>

            {/* Pinned Safety Reminder Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2.5 shadow-xs border border-amber-400">
              <ShieldCheck className="w-5 h-5 shrink-0 text-amber-900" />
              <span>
                Peringatan: JualRugi.my.id tidak menengahi pembayaran. Jangan pernah transfer DP atau uang muka kepada siapapun!
              </span>
            </div>

            {/* Recent Listings to Chat With */}
            <div className="space-y-2">
              {listings.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenChat(item)}
                  className="p-3.5 rounded-2xl bg-white border border-sky-100 hover:border-sky-300 shadow-xs flex items-center justify-between gap-3 cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-3 truncate">
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-sky-100"
                    />
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        Penjual: {item.seller.name} • {item.location}
                      </p>
                      <span className="text-xs font-black text-sky-800">
                        Rp {item.sellingPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <button className="py-1.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shrink-0 shadow-xs shadow-sky-500/20">
                    Buka Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AKUN & IKLAN SAYA */}
        {activeTab === 'account' && (
          <SellerDashboard
            currentUser={currentUser}
            listings={listings}
            onOpenNewListing={() => setIsPostModalOpen(true)}
            onOpenQRIS={handleOpenQRIS}
            onDeleteListing={handleDeleteListing}
            onOpenListingDetail={(listing) => setSelectedListing(listing)}
            onOpenSafetyGuide={() => setIsSafetyGuideOpen(true)}
            isLoggedIn={isLoggedIn}
            onLogin={handleOpenLogin}
            onLogout={handlePromptLogout}
            onOpenSupabaseSettings={() => setIsSupabaseModalOpen(true)}
            onOpenPanduanModal={() => setIsPanduanModalOpen(true)}
            onOpenWelcomeEmailSetup={() => setIsWelcomeEmailModalOpen(true)}
            onEditListing={handleOpenEditListing}
            onOpenAdmin={() => setIsAdminModalOpen(true)}
            onQuickTestAd={handleQuickTestAd}
            onPrefillTestAd={handlePrefillTestAd}
            onMarkAsSold={handleMarkListingAsSold}
            onOpenBuyQuotaModal={() => setIsBuyQuotaModalOpen(true)}
          />
        )}
      </main>

      {/* Website Footer & Contact Section */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'post') {
            setIsPostModalOpen(true);
          } else {
            if (tab === 'account' && currentUser.name === 'Rian Pratama') {
              const realUser = getActiveOrLatestUser();
              if (realUser) {
                const updatedProfile: UserProfile = {
                  id: realUser.id,
                  name: realUser.name,
                  role: realUser.role || 'buyer',
                  avatar:
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                  email: realUser.email,
                  phone: realUser.whatsapp || realUser.phone || '',
                  whatsapp: realUser.whatsapp || realUser.phone || '',
                  city: realUser.city || 'Jakarta Selatan',
                  freeListingUsed: false,
                  listingQuota: realUser.listingQuota ?? 1,
                  activeListingCount: 0,
                  permissions: {
                    locationGranted: false,
                    cameraGalleryGranted: false,
                  },
                };
                setCurrentUser(updatedProfile);
                setIsLoggedIn(true);
                try {
                  localStorage.setItem('jualrugi_current_user', JSON.stringify(updatedProfile));
                  localStorage.setItem('jualrugi_is_logged_in', 'true');
                } catch (e) {}
              }
            }
            setActiveTab(tab);
          }
        }}
        unreadCount={1}
      />

      {/* MODALS */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={handleCloseListing}
          onOpenChat={(listing) => handleOpenChat(listing)}
          onQuickMakeOffer={handleQuickMakeOffer}
          isFavorited={favoriteIds.includes(selectedListing.id)}
          onToggleFavorite={() => handleToggleFavorite(selectedListing.id)}
          onIncrementView={handleIncrementView}
          isSellerView={currentUser.role === 'seller'}
          currentUser={currentUser}
          onExtendListing={handleExtendListing}
          onMarkAsSold={handleMarkAsSold}
          onEditListing={handleOpenEditListing}
          onUpgradeMayar={handleOpenQRIS}
        />
      )}

      {/* MODAL EDIT IKLAN */}
      {isEditListingModalOpen && (
        <EditListingModal
          isOpen={isEditListingModalOpen}
          listing={editingListing}
          onClose={() => {
            setIsEditListingModalOpen(false);
            setEditingListing(null);
          }}
          onSave={handleSaveEditedListing}
        />
      )}

      {/* MODAL KONFIRMASI MODERASI PASCA EDIT ("SAYA PAHAM") */}
      {editModerationNotice.isOpen && (
        <EditModerationModal
          isOpen={editModerationNotice.isOpen}
          listingTitle={editModerationNotice.listing?.title}
          onConfirm={handleConfirmEditModeration}
        />
      )}

      {isPostModalOpen && (
        <PostListingModal
          onClose={() => {
            setIsPostModalOpen(false);
            setPostInitialPreset(null);
          }}
          currentUser={currentUser}
          initialPreset={postInitialPreset}
          isBlocked={blockedUserIds.includes(currentUser.id)}
          onListingApproved={(listing) => {
            setPostInitialPreset(null);
            handleListingApproved(listing);
          }}
          onOpenMayarPromotion={(pkg) => {
            setQrisListing(null);
            setQrisType(pkg);
            setIsQRISModalOpen(true);
          }}
          onUpdatePermissions={(perms) => {
            setCurrentUser((prev) => ({
              ...prev,
              permissions: {
                cameraGalleryGranted: perms.cameraGalleryGranted,
                locationGranted: prev.permissions?.locationGranted || false,
              },
            }));
          }}
          onOpenBuyQuotaModal={() => setIsBuyQuotaModalOpen(true)}
        />
      )}

      {activeChatListing && (
        <ChatModal
          key={activeChatListing.id}
          onClose={() => {
            setActiveChatListing(null);
            setChatInitialOffer(undefined);
          }}
          listing={activeChatListing}
          currentUser={currentUser}
          initialOfferText={chatInitialOffer}
        />
      )}

      {isQRISModalOpen && (
        <QRISModal
          onClose={() => setIsQRISModalOpen(false)}
          listing={qrisListing}
          type={qrisType}
          onSuccess={handleQRISSuccess}
          userId={currentUser.id}
          userEmail={currentUser.email}
        />
      )}

      {/* MODAL BELI SLOT KUOTA IKLAN (1, 5, 10 KUOTA) */}
      <BuyQuotaModal
        isOpen={isBuyQuotaModalOpen}
        onClose={() => setIsBuyQuotaModalOpen(false)}
        currentUser={currentUser}
        onSimulateAdminApproval={(amount) => handleAddUserQuota(currentUser.id, amount)}
      />

      {/* DASHBOARD KONTROL ADMIN TERPROTEKSI */}
      {isAdminModalOpen && (
        <AdminDashboardModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          listings={listings}
          onToggleSundul={handleAdminToggleSundul}
          onToggleSuperBU={handleAdminToggleSuperBU}
          onDeleteListing={handleDeleteListing}
          users={[BUYER_USER, SELLER_USER, currentUser]}
          blockedUserIds={blockedUserIds}
          onToggleBlockUser={handleToggleBlockUser}
          onViewListingDetail={(listing) => setSelectedListing(listing)}
          onAddUserQuota={handleAddUserQuota}
        />
      )}

      {/* Onboarding Lokasi GPS Modal (Setelah Pendaftaran / Sign Up) */}
      <LocationPermissionModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationGranted={(city) => {
          setCurrentUser((prev) => ({
            ...prev,
            city,
            permissions: {
              locationGranted: true,
              cameraGalleryGranted: prev.permissions?.cameraGalleryGranted || false,
            },
          }));
          showToast(`📍 Lokasi COD berhasil diatur ke ${city}`);
        }}
      />

      {isSafetyGuideOpen && (
        <CODSafetyGuideModal
          isOpen={isSafetyGuideOpen}
          onClose={() => setIsSafetyGuideOpen(false)}
        />
      )}

      {/* Interactive Opening Vertical Banner (image_3.png) */}
      <PromoBannerModal
        isOpen={isPromoBannerOpen}
        onClose={handleClosePromoBanner}
        onBannerAction={handlePromoBannerAction}
        isLoggedIn={isLoggedIn}
      />

      {/* Authentication Modal (Google Priority + Email/Phone) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authModalMode}
        onOpenWelcomeEmailSetup={() => setIsWelcomeEmailModalOpen(true)}
      />

      {/* Modal Konfirmasi Keluar Akun (In-App React Dialog, Bebas Blokir Browser) */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <LogOut className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-950">Konfirmasi Keluar Akun</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun <strong className="text-slate-800">{currentUser.name}</strong>? Anda dapat masuk kembali dengan mudah kapan saja.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition cursor-pointer shadow-sm shadow-rose-600/30 active:scale-95"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan & Panduan Supabase Online */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onOpenPanduanModal={() => {
          setIsSupabaseModalOpen(false);
          setIsPanduanModalOpen(true);
        }}
        onConfigSaved={async () => {
          const remoteData = await fetchListingsFromSupabase();
          if (remoteData && remoteData.length > 0) {
            setListings(remoteData);
          }
          showToast('⚡ Database Supabase terhubung & data disinkronkan!');
        }}
      />

      {/* Modal Panduan Interaktif Lengkap (Bisa Dibaca Langsung + Unduh PDF Tanpa Blokir) */}
      <PanduanPDFModal
        isOpen={isPanduanModalOpen}
        onClose={() => setIsPanduanModalOpen(false)}
        onOpenSupabaseConfig={() => {
          setIsPanduanModalOpen(false);
          setIsSupabaseModalOpen(true);
        }}
      />

      {/* Modal Setup & Uji Coba Otomatisasi Welcome Email */}
      <WelcomeEmailSetupModal
        isOpen={isWelcomeEmailModalOpen}
        onClose={() => setIsWelcomeEmailModalOpen(false)}
        defaultEmail={currentUser.email || 'bca.ccpl@gmail.com'}
        onSuccessToast={(msg) => showToast(msg)}
      />

      {/* Live Activity Social Proof Ticker (FOMO & Promo Booster) */}
      <LiveActivityTicker />
    </div>
  );
}
