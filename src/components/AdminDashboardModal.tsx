import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  Flame,
  Trash2,
  Mail,
  UserCheck,
  UserX,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  Lock,
  RefreshCw,
  Eye,
  Filter,
  MessageCircle,
  Loader2,
  Key,
  Send,
  EyeOff,
  Sparkles,
  Zap,
  Users,
  Layers,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  PhoneCall,
  Flag,
  ShieldAlert,
  AlertOctagon,
  MapPin,
  Plus,
  Phone,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ListFilter,
  SlidersHorizontal,
  UserPlus,
} from 'lucide-react';
import { Listing, UserProfile } from '../types';
import { WA_ADMIN_PHONE } from '../data/mayarConfig';
import {
  AdReport,
  getStoredAdReports,
  updateAdReportStatus,
  deleteAdReport,
  getPendingReportCount,
  generateDemoReport,
} from '../services/reportService';
import {
  RegisteredUser,
  getStoredUsers,
  syncUsersFromServer,
  updateStoredUserQuota,
  getUserQuota,
  exportUsersToCSV,
  exportUsersToXLS,
  exportUsersToPDF,
  formatIndoDate,
  getWhatsAppChatLink,
} from '../services/userService';
import {
  triggerMonetizationActivatedEmail,
  triggerAdPublishedEmail,
  triggerQuotaActivatedEmail,
  triggerAdTakenDownEmailAndWa,
  getDynamicAdLink,
} from '../services/adPublishedEmailService';
import {
  getBrevoConfig,
  saveBrevoConfig,
  sendWelcomeEmailAutomation,
} from '../services/welcomeEmail';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[];
  onToggleSundul: (listingId: string, currentStatus: boolean) => void;
  onToggleSuperBU: (listingId: string, currentStatus: boolean) => void;
  onDeleteListing: (listingId: string) => void;
  users: UserProfile[];
  blockedUserIds: string[];
  onToggleBlockUser: (userId: string, isBlocked: boolean) => void;
  onViewListingDetail?: (listing: Listing) => void;
  onAddUserQuota?: (userId: string, addedQuota: number) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  listings,
  onToggleSundul,
  onToggleSuperBU,
  onDeleteListing,
  users,
  blockedUserIds,
  onToggleBlockUser,
  onViewListingDetail,
  onAddUserQuota,
}) => {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return (
      localStorage.getItem('isAdminLoggedIn') === 'true' ||
      sessionStorage.getItem('isAdminLoggedIn') === 'true'
    );
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'listings' | 'users' | 'emailLogs' | 'brevoConfig' | 'reports'>('listings');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sundul' | 'superbu'>('all');
  const [userFilter, setUserFilter] = useState<'all' | 'new' | 'blocked' | 'active'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userViewMode, setUserViewMode] = useState<'card' | 'table'>('card');
  const [isMetricsCollapsed, setIsMetricsCollapsed] = useState(false);

  // Helper mendeteksi pendaftar baru (dalam 7 hari terakhir)
  const isNewUser = (registeredAt?: string): boolean => {
    if (!registeredAt) return false;
    const t = new Date(registeredAt).getTime();
    if (isNaN(t)) return false;
    const diffHours = (Date.now() - t) / (1000 * 60 * 60);
    return diffHours <= 168; // dalam 7 hari
  };

  // Helper format waktu relatif untuk pendaftar baru
  const formatRelativeTime = (dateStr?: string): string => {
    if (!dateStr) return '-';
    try {
      const t = new Date(dateStr).getTime();
      if (isNaN(t)) return dateStr;
      const diffMs = Date.now() - t;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} jam lalu`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return formatIndoDate(dateStr);
    } catch {
      return dateStr;
    }
  };

  // Ad Reports State (Laporan Iklan Curang / Melanggar dari Pembeli)
  const [adReports, setAdReports] = useState<AdReport[]>(() => getStoredAdReports());
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  // Persistent Registered Users State (Disinkronkan dari localStorage & Server)
  const [persistentUsers, setPersistentUsers] = useState<RegisteredUser[]>(() => getStoredUsers());
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // Email Audit Logs from localStorage
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  // Brevo API Key Configuration State
  const [brevoKeyInput, setBrevoKeyInput] = useState('');
  const [brevoSenderEmail, setBrevoSenderEmail] = useState('admin@jualrugi.my.id');
  const [brevoSenderName, setBrevoSenderName] = useState('JualRugi.my.id');
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [isSavingBrevo, setIsSavingBrevo] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('bca.ccpl@gmail.com');
  const [testEmailType, setTestEmailType] = useState<'welcome' | 'adPublished'>('welcome');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string; details?: any } | null>(null);

  // Handler Tombol Refresh Data Pengguna (Manual & Real-time Sync)
  const handleRefreshUsers = async () => {
    setIsRefreshingUsers(true);
    try {
      const latest = await syncUsersFromServer();
      if (latest && latest.length > 0) {
        setPersistentUsers(latest);
        showNotification(`✅ Data pengguna berhasil disegarkan! Ditemukan ${latest.length} akun terdaftar.`);
      } else {
        const local = getStoredUsers();
        setPersistentUsers(local);
        showNotification(`✅ Data pengguna diperbarui (${local.length} akun).`);
      }
    } catch (err) {
      const local = getStoredUsers();
      setPersistentUsers(local);
      showNotification('✅ Data pengguna disegarkan dari penyimpanan lokal.');
    } finally {
      setTimeout(() => setIsRefreshingUsers(false), 400);
    }
  };

  // Muat data saat modal dibuka atau tab berganti
  useEffect(() => {
    if (isOpen) {
      loadEmailLogs();
      setPersistentUsers(getStoredUsers());
      setAdReports(getStoredAdReports());

      // Sinkronisasi data pengguna dari server & Supabase
      syncUsersFromServer().then((latest) => {
        if (latest && latest.length > 0) {
          setPersistentUsers(latest);
        }
      });

      const cfg = getBrevoConfig();
      if (cfg.apiKey && !cfg.apiKey.includes('your_')) {
        setBrevoKeyInput(cfg.apiKey);
      }
      if (cfg.senderEmail) setBrevoSenderEmail(cfg.senderEmail);
      if (cfg.senderName) setBrevoSenderName(cfg.senderName);
    }
  }, [isOpen, activeTab]);

  // Listener event pendaftaran user baru & laporan iklan baru
  useEffect(() => {
    const handleUserRegistered = () => {
      setPersistentUsers(getStoredUsers());
    };
    const handleNewReport = () => {
      setAdReports(getStoredAdReports());
      showNotification('🚨 Laporan iklan baru masuk dari pembeli!');
    };
    const handleReportUpdated = () => {
      setAdReports(getStoredAdReports());
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jualrugi_registered_users') {
        setPersistentUsers(getStoredUsers());
      }
      if (e.key === 'jualrugi_ad_reports') {
        setAdReports(getStoredAdReports());
      }
    };
    window.addEventListener('jualrugi_user_registered', handleUserRegistered);
    window.addEventListener('jualrugi_new_ad_report', handleNewReport);
    window.addEventListener('jualrugi_ad_report_updated', handleReportUpdated);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('jualrugi_user_registered', handleUserRegistered);
      window.removeEventListener('jualrugi_new_ad_report', handleNewReport);
      window.removeEventListener('jualrugi_ad_report_updated', handleReportUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadEmailLogs = () => {
    try {
      const logs = JSON.parse(localStorage.getItem('jualrugi_ad_published_emails') || '[]');
      setEmailLogs(logs);
    } catch {
      setEmailLogs([]);
    }
  };

  const handleSaveBrevoConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = brevoKeyInput.trim();

    if (cleanKey && cleanKey.startsWith('brevo-code:')) {
      alert('⚠️ PERHATIAN:\nNilai "brevo-code:..." adalah kode DNS TXT verifikasi domain, BUKAN API Key Brevo!\n\nAPI Key resmi Brevo v3 selalu diawali dengan "xkeysib-...". Silakan ambil API Key dari https://app.brevo.com/settings/keys/api');
      return;
    }

    if (cleanKey && !cleanKey.startsWith('xkeysib-')) {
      alert('⚠️ API Key Brevo tidak valid!\nAPI Key resmi Brevo v3 wajib diawali dengan "xkeysib-...".');
      return;
    }

    setIsSavingBrevo(true);
    saveBrevoConfig({
      apiKey: cleanKey,
      senderEmail: brevoSenderEmail.trim() || 'admin@jualrugi.my.id',
      senderName: brevoSenderName.trim() || 'JualRugi.my.id',
    });

    setTimeout(() => {
      setIsSavingBrevo(false);
      showNotification('✅ Konfigurasi API Key Brevo berhasil disimpan di sistem & browser!');
    }, 400);
  };

  const handleAddQuotaManual = (
    userId: string,
    userName: string,
    userEmail: string,
    userPhone: string,
    amount: number
  ) => {
    const res = updateStoredUserQuota(userId, amount);
    if (onAddUserQuota) {
      onAddUserQuota(userId, amount);
    }
    // Update local persistentUsers state so UI refreshes immediately
    setPersistentUsers(getStoredUsers());

    const targetPhone = userPhone || res.user?.whatsapp || res.user?.phone || '';

    // Pemicu Double Notifikasi Wajib (Email Brevo + WA Fonnte):
    // Subject: 'kuota iklan'
    // Isi Email & WA Sama Persis: 'Selamat kuota iklan anda telah diperbaharui,silakan pasang iklan anda sekarang https://jualrugi.my.id/?action=post Team Admin jualrugi.my.id'
    triggerQuotaActivatedEmail({
      recipientEmail: userEmail || 'seller@jualrugi.my.id',
      recipientPhone: targetPhone,
      whatsapp: targetPhone,
      recipientName: userName,
      addedQuota: amount,
      newTotalQuota: res.newQuota,
    })
      .then(() => {
        loadEmailLogs();
      })
      .catch((err) => {
        console.warn('Gagal memicu email aktivasi kuota iklan:', err);
      });

    showNotification(
      `✅ Berhasil menambahkan +${amount} kuota iklan untuk ${userName}! Double notifikasi (Email 'kuota iklan' & WhatsApp) dikirim ke ${userEmail || '-'} / ${targetPhone || '-'}. Total: ${res.newQuota} slot.`
    );
  };

  const handleSendTestEmail = async () => {
    const cleanTarget = testEmailAddress.trim();
    if (!cleanTarget || !cleanTarget.includes('@')) {
      alert('Masukkan alamat email tujuan yang valid.');
      return;
    }

    const cleanKey = brevoKeyInput.trim();
    if (!cleanKey || !cleanKey.startsWith('xkeysib-')) {
      alert('Mohon masukkan dan simpan API Key Brevo yang valid (diawali xkeysib-...) terlebih dahulu.');
      return;
    }

    // Simpan dulu config sebelum test
    handleSaveBrevoConfig();

    setIsSendingTest(true);
    setTestStatus(null);

    try {
      if (testEmailType === 'welcome') {
        const res = await sendWelcomeEmailAutomation({
          name: 'Admin JualRugi',
          email: cleanTarget,
          phone: '081234567890',
        });
        setTestStatus({
          success: res.success,
          message: res.message || 'Welcome email berhasil dipicu.',
          details: res,
        });
      } else {
        const res = await triggerAdPublishedEmail({
          listingId: 'ad-real-' + Date.now(),
          listingTitle: 'Honda Vario 150 CBS ISS 2021 (Tes Iklan Tayang)',
          recipientEmail: cleanTarget,
          recipientName: 'Admin JualRugi',
          subject: 'Iklan Tayang (Tes Admin)',
        });
        setTestStatus({
          success: res.success,
          message: res.message || 'Notifikasi iklan tayang berhasil dipicu.',
          details: res,
        });
      }
    } catch (err: any) {
      setTestStatus({
        success: false,
        message: err.message || 'Gagal memicu pengiriman email.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const showNotification = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 3500);
  };

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Helper hash SHA-256 fallback jika endpoint server offline (tanpa plain-text exposure)
  const sha256Hex = async (text: string): Promise<string> => {
    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return '';
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsAuthenticating(true);

    const userClean = usernameInput.trim();
    const passClean = passwordInput;

    try {
      // 1. Verifikasi server-side terproteksi
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userClean, password: passClean }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          setIsLoggedIn(true);
          localStorage.setItem('isAdminLoggedIn', 'true');
          sessionStorage.setItem('isAdminLoggedIn', 'true');
          setUsernameInput('');
          setPasswordInput('');
          setLoginError('');
          showNotification('Login Admin berhasil! Selamat datang di Panel Kontrol.');
          setIsAuthenticating(false);
          return;
        }
      } else if (res.status === 401) {
        setLoginError('Username atau password yang Anda masukkan salah. Silakan coba lagi.');
        setIsAuthenticating(false);
        return;
      }
    } catch {
      // Fallback offline jika server tidak dapat dihubungi
    }

    // 2. Fallback cryptographic hash check (SHA-256) tanpa mengekspos plaintext
    const userHash = await sha256Hex(userClean);
    const passHash = await sha256Hex(passClean);

    if (
      userHash === '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' &&
      passHash === '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
    ) {
      setIsLoggedIn(true);
      localStorage.setItem('isAdminLoggedIn', 'true');
      sessionStorage.setItem('isAdminLoggedIn', 'true');
      setUsernameInput('');
      setPasswordInput('');
      setLoginError('');
      showNotification('Login Admin berhasil! Selamat datang di Panel Kontrol.');
    } else {
      setLoginError('Username atau password yang Anda masukkan salah. Silakan coba lagi.');
    }
    setIsAuthenticating(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('isAdminLoggedIn');
    setUsernameInput('');
    setPasswordInput('');
    showNotification('Anda telah keluar dari Dashboard Admin.');
  };

  // Copy ID Iklan helper
  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        (item.seller?.name || '').toLowerCase().includes(q) ||
        (item.seller?.phoneMasked || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filterType === 'sundul') {
        return !!item.sundulAt;
      }
      if (filterType === 'superbu') {
        return !!item.isSuperBU;
      }
      return true;
    });
  }, [listings, searchQuery, filterType]);

  // Combined Unique Users list (Data Pendaftar Persisten + Users Props + Sellers)
  const allUsersList = useMemo(() => {
    const userMap = new Map<string, RegisteredUser>();

    // 1. Masukkan pendaftar persisten (termasuk yang baru mendaftar dari Form Registrasi)
    persistentUsers.forEach((u) => {
      const isBlocked = blockedUserIds.includes(u.id);
      const quota = typeof u.listingQuota === 'number' ? u.listingQuota : getUserQuota(u.id);
      userMap.set(u.email.toLowerCase(), {
        ...u,
        listingQuota: quota,
        status: isBlocked ? 'blocked' : (u.status || 'active'),
        count: u.count || 0,
      });
    });

    // 2. Masukkan users dari props
    users.forEach((u) => {
      const emailKey = (u.email || `${u.id}@jualrugi.my.id`).toLowerCase();
      if (!userMap.has(emailKey)) {
        const isBlocked = blockedUserIds.includes(u.id);
        const quota = (u as any).listingQuota ?? getUserQuota(u.id);
        userMap.set(emailKey, {
          id: u.id,
          name: u.name,
          email: u.email || `${u.id}@jualrugi.my.id`,
          whatsapp: (u as any).whatsapp || u.phone || '081299887766',
          phone: u.phone || (u as any).whatsapp || '0812-9988-7766',
          role: u.role || 'buyer',
          registeredAt: (u as any).registeredAt || '2026-11-01T08:00:00.000Z',
          city: u.city || 'Jakarta Selatan',
          status: isBlocked ? 'blocked' : 'active',
          count: 0,
          listingQuota: quota,
        });
      }
    });

    // 3. Tambahkan penjual dari listings dan hitung jumlah iklannya
    listings.forEach((l) => {
      const sellerId = l.user_id || l.seller?.id || 'seller-unknown';
      const sellerEmail = ((l as any).seller_email || `${sellerId.replace(/[^a-z0-9]/gi, '')}@jualrugi.my.id`).toLowerCase();

      let matchedUser = userMap.get(sellerEmail);
      if (!matchedUser) {
        for (const item of userMap.values()) {
          if (item.id === sellerId) {
            matchedUser = item;
            break;
          }
        }
      }

      if (matchedUser) {
        matchedUser.count = (matchedUser.count || 0) + 1;
      } else {
        const isBlocked = blockedUserIds.includes(sellerId);
        const quota = getUserQuota(sellerId);
        userMap.set(sellerEmail, {
          id: sellerId,
          name: l.seller?.name || 'Pengiklan',
          email: sellerEmail,
          whatsapp: (l.seller?.phoneMasked || '081288991234').replace(/\D/g, '') || '081288991234',
          phone: l.seller?.phoneMasked || '0812-8899-1234',
          role: 'seller',
          registeredAt: l.createdAt || '2026-11-02T10:00:00.000Z',
          city: l.location || 'Jakarta Selatan',
          status: isBlocked ? 'blocked' : 'active',
          count: 1,
          listingQuota: quota,
        });
      }
    });

    // Urutkan pendaftar terbaru di posisi paling atas (Newest First)
    const list = Array.from(userMap.values());
    list.sort((a, b) => {
      const timeA = new Date(a.registeredAt || 0).getTime();
      const timeB = new Date(b.registeredAt || 0).getTime();
      return timeB - timeA;
    });

    return list;
  }, [persistentUsers, users, listings, blockedUserIds]);

  // Statistik Pengguna
  const newUsersCount = useMemo(() => {
    return allUsersList.filter((u) => isNewUser(u.registeredAt)).length;
  }, [allUsersList]);

  const activeUsersCount = useMemo(() => {
    return allUsersList.filter((u) => !blockedUserIds.includes(u.id) && u.status !== 'blocked').length;
  }, [allUsersList, blockedUserIds]);

  const blockedUsersCount = useMemo(() => {
    return allUsersList.filter((u) => blockedUserIds.includes(u.id) || u.status === 'blocked').length;
  }, [allUsersList, blockedUserIds]);

  // Filtered users based on userFilter and userSearchQuery with Smart Phone Matching
  const filteredUsersList = useMemo(() => {
    return allUsersList.filter((u) => {
      const isBlocked = blockedUserIds.includes(u.id) || u.status === 'blocked';
      if (userFilter === 'blocked' && !isBlocked) return false;
      if (userFilter === 'active' && isBlocked) return false;
      if (userFilter === 'new' && !isNewUser(u.registeredAt)) return false;

      const q = userSearchQuery.trim().toLowerCase();
      if (q) {
        // 1. Text match (ID, Nama, Email, Kota, Role)
        const textMatch =
          (u.id || '').toLowerCase().includes(q) ||
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.city || '').toLowerCase().includes(q) ||
          (u.role || '').toLowerCase().includes(q);

        if (textMatch) return true;

        // 2. Pencarian Cerdas Nomor WhatsApp / Telepon (Mendukung format 628..., 08..., tanda hubung, spasi)
        const qDigits = q.replace(/\D/g, '');
        if (qDigits.length >= 3) {
          const uWaDigits = (u.whatsapp || '').replace(/\D/g, '');
          const uPhoneDigits = (u.phone || '').replace(/\D/g, '');

          // Ekstrak inti nomor tanpa kode 62 atau 0 di depan
          const qCore = qDigits.startsWith('62')
            ? qDigits.slice(2)
            : qDigits.startsWith('0')
            ? qDigits.slice(1)
            : qDigits;

          const waCore = uWaDigits.startsWith('62')
            ? uWaDigits.slice(2)
            : uWaDigits.startsWith('0')
            ? uWaDigits.slice(1)
            : uWaDigits;

          const phoneCore = uPhoneDigits.startsWith('62')
            ? uPhoneDigits.slice(2)
            : uPhoneDigits.startsWith('0')
            ? uPhoneDigits.slice(1)
            : uPhoneDigits;

          const phoneMatch =
            uWaDigits.includes(qDigits) ||
            uPhoneDigits.includes(qDigits) ||
            (qCore.length >= 3 && (waCore.includes(qCore) || phoneCore.includes(qCore)));

          if (phoneMatch) return true;
        }

        return false;
      }

      return true;
    });
  }, [allUsersList, blockedUserIds, userFilter, userSearchQuery]);

  // Perhitungan Jumlah Laporan yang Perlu Ditindaklanjuti
  const pendingReportCount = useMemo(() => {
    return adReports.filter((r) => r.status === 'pending' || r.status === 'investigating').length;
  }, [adReports]);

  // Filtered Ad Reports based on reportFilter and reportSearchQuery
  const filteredReportsList = useMemo(() => {
    return adReports.filter((rep) => {
      if (reportFilter === 'pending') {
        if (rep.status !== 'pending' && rep.status !== 'investigating') return false;
      } else if (reportFilter === 'resolved') {
        if (rep.status !== 'resolved') return false;
      } else if (reportFilter === 'dismissed') {
        if (rep.status !== 'dismissed') return false;
      }

      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.toLowerCase().trim();
        const matchTitle = (rep.listingTitle || '').toLowerCase().includes(q);
        const matchReporter = (rep.reporterName || '').toLowerCase().includes(q) || (rep.reporterContact || '').toLowerCase().includes(q);
        const matchSeller = (rep.sellerName || '').toLowerCase().includes(q) || (rep.sellerWhatsapp || '').toLowerCase().includes(q);
        const matchReason = (rep.reasonLabel || '').toLowerCase().includes(q) || (rep.notes || '').toLowerCase().includes(q);
        const matchId = (rep.id || '').toLowerCase().includes(q) || (rep.listingId || '').toLowerCase().includes(q);
        if (!matchTitle && !matchReporter && !matchSeller && !matchReason && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [adReports, reportFilter, reportSearchQuery]);

  // Handlers Tindakan Moderasi Laporan Iklan oleh Admin
  const handleResolveReport = (reportId: string, notes?: string) => {
    updateAdReportStatus(reportId, 'resolved', notes || 'Telah ditindaklanjuti dan diverifikasi tuntas oleh Admin.');
    setAdReports(getStoredAdReports());
    showNotification('✅ Laporan iklan ditandai sebagai TUNTAS/SELESAI.');
  };

  const handleDismissReport = (reportId: string) => {
    updateAdReportStatus(reportId, 'dismissed', 'Laporan tidak ditemukan indikasi pelanggaran / diabaikan.');
    setAdReports(getStoredAdReports());
    showNotification('ℹ️ Laporan telah diabaikan.');
  };

  const handleTakeDownReportedListing = async (report: AdReport) => {
    if (
      window.confirm(
        `🚨 PERINGATAN MODERASI:\n\nApakah Anda yakin ingin men-takedown & menghapus permanen iklan "${report.listingTitle}" (ID: ${report.listingId})?\n\nSistem akan otomatis:\n1. Menghapus iklan dari peredaran publik.\n2. Mengirim double notifikasi (Email Brevo & WhatsApp Fonnte) ke seller berisi alasan take down.\n3. Menginformasikan bahwa iklan yang di-takedown TIDAK mengembalikan kuota iklan.\n4. Mengarahkan opsi beli slot kuota jika kuota 0.`
      )
    ) {
      // 1. Dapatkan detail kontak penjual
      const matchedListing = listings.find((l) => l.id === report.listingId);
      const matchedUser = allUsersList.find(
        (u) =>
          u.id === report.sellerId ||
          u.name.toLowerCase() === report.sellerName.toLowerCase() ||
          (report.sellerWhatsapp && u.whatsapp?.replace(/\D/g, '').includes(report.sellerWhatsapp.replace(/\D/g, '')))
      );

      const targetEmail =
        matchedUser?.email ||
        (matchedListing?.seller as any)?.email ||
        (matchedListing as any)?.seller_email ||
        `${report.sellerId.replace(/[^a-z0-9]/gi, '')}@jualrugi.my.id`;

      const targetPhone =
        report.sellerWhatsapp ||
        matchedUser?.whatsapp ||
        matchedUser?.phone ||
        (matchedListing?.seller as any)?.phone ||
        '6289673686625';

      const targetName = report.sellerName || matchedUser?.name || 'Penjual JualRugi';

      // 2. Hapus iklan dari listing publik
      onDeleteListing(report.listingId);

      // 3. Update status laporan menjadi resolved
      const resolutionNote = `Iklan di-takedown permanen karena pelanggaran: ${report.reasonLabel}. Double notifikasi alasan & ketentuan kuota telah dikirim ke Email (${targetEmail}) & WhatsApp (${targetPhone}). Kuota iklan tidak dikembalikan.`;
      updateAdReportStatus(report.id, 'resolved', resolutionNote);
      setAdReports(getStoredAdReports());

      // 4. Kirim Double Notifikasi ke Seller (Email Brevo + WA Fonnte)
      const takedownReasonText = `${report.reasonLabel}${report.notes ? ` (${report.notes})` : ''}`;
      try {
        await triggerAdTakenDownEmailAndWa({
          recipientEmail: targetEmail,
          recipientPhone: targetPhone,
          whatsapp: targetPhone,
          recipientName: targetName,
          sellerId: report.sellerId,
          listingId: report.listingId,
          listingTitle: report.listingTitle,
          takedownReason: takedownReasonText,
          adminNotes: 'Pelanggaran SOP transaksi COD aman JualRugi.my.id. Kuota iklan tidak dikembalikan.',
        });
      } catch (notifErr) {
        console.warn('Gagal memicu triggerAdTakenDownEmailAndWa:', notifErr);
      }

      // Refresh log email agar langsung tampak di tab log
      loadEmailLogs();

      showNotification(
        `🚨 Iklan "${report.listingTitle}" BERHASIL DI-TAKEDOWN! Notifikasi alasan & ketentuan kuota dikirim ke Email & WA seller (${targetPhone}).`
      );
    }
  };

  const handleBlockReportedSeller = (report: AdReport) => {
    const isCurrentlyBlocked = blockedUserIds.includes(report.sellerId);
    if (isCurrentlyBlocked) {
      onToggleBlockUser(report.sellerId, true);
      showNotification(`✅ Blokir akun ${report.sellerName} telah dibuka.`);
    } else {
      if (window.confirm(`⛔ KONFIRMASI PEMBLOKIRAN:\n\nApakah Anda yakin ingin MEMBLOKIR penjual "${report.sellerName}" (ID: ${report.sellerId})?\n\nPenjual ini tidak akan bisa login, membalas chat, atau memasang iklan baru.`)) {
        onToggleBlockUser(report.sellerId, false);
        updateAdReportStatus(report.id, 'investigating', `Penjual ${report.sellerName} telah diblokir/dicekal oleh Admin.`);
        setAdReports(getStoredAdReports());
        showNotification(`⛔ Akun penjual ${report.sellerName} BERHASIL DIBLOKIR!`);
      }
    }
  };

  const handleDeleteReportArchive = (reportId: string) => {
    if (window.confirm('Hapus riwayat laporan ini dari arsip dashboard?')) {
      deleteAdReport(reportId);
      setAdReports(getStoredAdReports());
      showNotification('🗑️ Laporan berhasil dihapus dari arsip.');
    }
  };

  // Handler Uji Coba: Muat Simulasi 1 Laporan Iklan (Live Demo)
  const handleTriggerDemoReport = () => {
    const targetListing = listings.find((l) => l.id === 'bu-001') || listings[0];
    const newDemo = generateDemoReport(
      targetListing
        ? {
            id: targetListing.id,
            title: targetListing.title,
            price: targetListing.sellingPrice,
            imageUrl: targetListing.imageUrl,
            location: targetListing.location,
            sellerId: targetListing.seller?.id || 'seller-agus',
            sellerName: targetListing.seller?.name || 'Agus Setiawan (Seller)',
            sellerWhatsapp: (targetListing.seller?.phoneMasked || '6289673686625').replace(/\D/g, '') || '6289673686625',
          }
        : undefined
    );
    setAdReports(getStoredAdReports());
    setReportFilter('pending');
    showNotification(`⚡ Simulasi 1 laporan iklan untuk "${newDemo.listingTitle}" berhasil dimuat! Anda dapat langsung menguji Take Down, Blokir Penjual, Chat WA, dll.`);
  };

  // Action: Toggle Sundul with Automatic Email Notification
  const handleToggleSundulWithEmail = async (listing: Listing) => {
    const currentStatus = !!listing.sundulAt;
    const willActivate = !currentStatus;

    onToggleSundul(listing.id, currentStatus);

    if (willActivate) {
      const sellerEmail =
        listing.user_id === 'seller-agus'
          ? 'agus.setiawan@gmail.com'
          : `${listing.id.toLowerCase()}@jualrugi.my.id`;

      try {
        await triggerMonetizationActivatedEmail({
          listingId: listing.id,
          listingTitle: listing.title,
          recipientEmail: sellerEmail,
          recipientName: listing.seller?.name || 'Pengiklan',
          packageType: 'sundul',
        });
        showNotification(
          `Sundul aktif! Email notifikasi otomatis dikirim ke ${sellerEmail}`
        );
        loadEmailLogs();
      } catch (e) {
        showNotification('Sundul aktif! (Log email tersimpan)');
      }
    } else {
      showNotification(`Status Sundul untuk ${listing.id} telah dinonaktifkan.`);
    }
  };

  // Action: Toggle BU Prioritas with Automatic Email Notification
  const handleToggleSuperBUWithEmail = async (listing: Listing) => {
    const currentStatus = !!listing.isSuperBU;
    const willActivate = !currentStatus;

    onToggleSuperBU(listing.id, currentStatus);

    if (willActivate) {
      const sellerEmail =
        listing.user_id === 'seller-agus'
          ? 'agus.setiawan@gmail.com'
          : `${listing.id.toLowerCase()}@jualrugi.my.id`;

      try {
        await triggerMonetizationActivatedEmail({
          listingId: listing.id,
          listingTitle: listing.title,
          recipientEmail: sellerEmail,
          recipientName: listing.seller?.name || 'Pengiklan',
          packageType: 'prioritas',
        });
        showNotification(
          `BU Prioritas aktif! Email notifikasi otomatis dikirim ke ${sellerEmail}`
        );
        loadEmailLogs();
      } catch (e) {
        showNotification('BU Prioritas aktif! (Log email tersimpan)');
      }
    } else {
      showNotification(`Status BU Prioritas untuk ${listing.id} telah dinonaktifkan.`);
    }
  };

  // Action: Delete Listing with Confirm Dialog
  const handleDeleteWithConfirmation = (listing: Listing) => {
    const confirmed = window.confirm(
      `Hapus Iklan Permanen?\n\nID: ${listing.id}\nJudul: "${listing.title}"\nPengiklan: ${listing.seller?.name}\n\nTindakan ini tidak dapat dibatalkan.`
    );
    if (confirmed) {
      onDeleteListing(listing.id);
      showNotification(`Iklan ${listing.id} berhasil dihapus.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-800 my-auto max-h-[92vh]">
        {/* Top Bar Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-wide">PANEL KONTROL ADMIN</h3>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-xs bg-sky-500 text-white">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Manajemen Iklan Mayar, Verifikasi WhatsApp & Kontrol Pengguna
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                title="Keluar dari sesi Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notifikasi Admin */}
        {adminToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{adminToast}</span>
            </div>
            <button onClick={() => setAdminToast(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* KONTEN UTAMA: LOGIN FORM ATAU DASHBOARD */}
        {!isLoggedIn ? (
          /* LOGIN GATE */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 shadow-inner border border-sky-100">
              <Lock className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900">Masuk Akses Admin</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Silakan masukkan kredensial administrator resmi untuk mengelola status transaksi & pengguna.
            </p>

            <form onSubmit={handleLogin} className="w-full mt-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Masuk ke Dashboard</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* DASHBOARD VIEW */
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Quick Metrics Bar - 5 Fully Clickable Interactive Buttons (Dapat Diciutkan di Mobile) */}
            <div className="bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="px-3.5 py-1.5 flex items-center justify-between sm:hidden border-b border-slate-200/60 bg-slate-100/70">
                <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Ringkasan Statistik
                </span>
                <button
                  type="button"
                  onClick={() => setIsMetricsCollapsed(!isMetricsCollapsed)}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-sky-700 text-[10px] font-black flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>{isMetricsCollapsed ? 'Tampilkan ▾' : 'Sembunyikan ▴'}</span>
                </button>
              </div>

              {!isMetricsCollapsed && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 p-3 sm:p-4 text-xs">
                  {/* Metric 1: Total Iklan */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('listings');
                      setFilterType('all');
                      setSearchQuery('');
                    }}
                    className={`p-3 rounded-2xl text-left transition-all active:scale-95 cursor-pointer border ${
                      activeTab === 'listings' && filterType === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400'
                        : 'bg-white hover:bg-slate-100/90 text-slate-800 border-slate-200 shadow-2xs hover:shadow-xs'
                    }`}
                    title="Klik untuk melihat semua daftar iklan"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black tracking-wide ${
                        activeTab === 'listings' && filterType === 'all' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        TOTAL IKLAN
                      </span>
                      <Layers className={`w-3.5 h-3.5 ${
                        activeTab === 'listings' && filterType === 'all' ? 'text-slate-300' : 'text-slate-400'
                      }`} />
                    </div>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="text-xl font-black">{listings.length}</span>
                      <span className={`text-[10px] font-bold ${
                        activeTab === 'listings' && filterType === 'all' ? 'text-slate-300' : 'text-sky-600'
                      }`}>
                        Lihat &rarr;
                      </span>
                    </div>
                  </button>

                  {/* Metric 2: Sundul Aktif */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('listings');
                      setFilterType('sundul');
                    }}
                    className={`p-3 rounded-2xl text-left transition-all active:scale-95 cursor-pointer border ${
                      activeTab === 'listings' && filterType === 'sundul'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                        : 'bg-white hover:bg-sky-50/80 text-slate-800 border-sky-200 shadow-2xs hover:shadow-xs'
                    }`}
                    title="Klik untuk filter iklan sundul aktif"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black flex items-center gap-1 ${
                        activeTab === 'listings' && filterType === 'sundul' ? 'text-sky-100' : 'text-sky-600'
                      }`}>
                        <ArrowUp className="w-3 h-3 stroke-[3]" /> SUNDUL AKTIF
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className={`text-xl font-black ${
                        activeTab === 'listings' && filterType === 'sundul' ? 'text-white' : 'text-sky-800'
                      }`}>
                        {listings.filter((l) => !!l.sundulAt).length}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        activeTab === 'listings' && filterType === 'sundul' ? 'text-sky-100' : 'text-sky-600'
                      }`}>
                        Filter &rarr;
                      </span>
                    </div>
                  </button>

                  {/* Metric 3: BU Prioritas */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('listings');
                      setFilterType('superbu');
                    }}
                    className={`p-3 rounded-2xl text-left transition-all active:scale-95 cursor-pointer border ${
                      activeTab === 'listings' && filterType === 'superbu'
                        ? 'bg-amber-500 text-amber-950 border-amber-500 shadow-md ring-2 ring-amber-300'
                        : 'bg-white hover:bg-amber-50/80 text-slate-800 border-amber-200 shadow-2xs hover:shadow-xs'
                    }`}
                    title="Klik untuk filter iklan BU Prioritas (Super BU)"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black flex items-center gap-1 ${
                        activeTab === 'listings' && filterType === 'superbu' ? 'text-amber-950' : 'text-amber-600'
                      }`}>
                        <Flame className="w-3 h-3 fill-current" /> BU PRIORITAS
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className={`text-xl font-black ${
                        activeTab === 'listings' && filterType === 'superbu' ? 'text-amber-950' : 'text-amber-800'
                      }`}>
                        {listings.filter((l) => !!l.isSuperBU).length}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        activeTab === 'listings' && filterType === 'superbu' ? 'text-amber-950' : 'text-amber-700'
                      }`}>
                        Filter &rarr;
                      </span>
                    </div>
                  </button>

                  {/* Metric 4: Pengguna Diblokir */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('users');
                      setUserFilter('blocked');
                    }}
                    className={`p-3 rounded-2xl text-left transition-all active:scale-95 cursor-pointer border ${
                      activeTab === 'users' && userFilter === 'blocked'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                        : 'bg-white hover:bg-rose-50/80 text-slate-800 border-rose-200 shadow-2xs hover:shadow-xs'
                    }`}
                    title="Klik untuk melihat pengguna yang diblokir"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black flex items-center gap-1 ${
                        activeTab === 'users' && userFilter === 'blocked' ? 'text-rose-100' : 'text-rose-600'
                      }`}>
                        <UserX className="w-3 h-3" /> DIBLOKIR
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className={`text-xl font-black ${
                        activeTab === 'users' && userFilter === 'blocked' ? 'text-white' : 'text-rose-700'
                      }`}>
                        {blockedUserIds.length}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        activeTab === 'users' && userFilter === 'blocked' ? 'text-rose-100' : 'text-rose-600'
                      }`}>
                        Kelola &rarr;
                      </span>
                    </div>
                  </button>

                  {/* Metric 5: Laporan Iklan (Sistem Keamanan & Moderasi Anti-Fraud) */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reports');
                      setReportFilter('pending');
                    }}
                    className={`p-3 rounded-2xl text-left transition-all active:scale-95 cursor-pointer border col-span-2 sm:col-span-1 ${
                      activeTab === 'reports'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-md ring-2 ring-rose-300'
                        : pendingReportCount > 0
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-950 border-rose-300 shadow-2xs animate-pulse'
                        : 'bg-white hover:bg-slate-100/90 text-slate-800 border-slate-200 shadow-2xs hover:shadow-xs'
                    }`}
                    title="Klik untuk membuka antrean laporan iklan dari pembeli"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black flex items-center gap-1 ${
                        activeTab === 'reports'
                          ? 'text-rose-100'
                          : pendingReportCount > 0
                          ? 'text-rose-700 font-black'
                          : 'text-slate-500'
                      }`}>
                        <ShieldAlert className="w-3.5 h-3.5" /> LAPORAN
                      </span>
                      {pendingReportCount > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-600 text-white">
                          PERLU TINDAKAN
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="text-xl font-black">
                        {pendingReportCount > 0 ? pendingReportCount : adReports.length}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        activeTab === 'reports'
                          ? 'text-rose-100'
                          : pendingReportCount > 0
                          ? 'text-rose-700'
                          : 'text-slate-500'
                      }`}>
                        {pendingReportCount > 0 ? 'Tindak! &rarr;' : 'Lihat &rarr;'}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Compact Warning Bar jika Brevo API Key belum disetting (Hanya tampil jika belum diisi dan bukan di tab Brevo) */}
            {(!brevoKeyInput || !brevoKeyInput.startsWith('xkeysib-')) && activeTab !== 'brevoConfig' && (
              <div className="mx-3 sm:mx-4 mt-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between text-xs font-bold shadow-xs shrink-0 animate-pulse">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                  <span>⚠️ API Key Brevo belum dimasukkan! Welcome Email &amp; Notifikasi butuh API Key aktif.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('brevoConfig')}
                  className="px-3 py-1 rounded-xl bg-white text-orange-700 font-black text-xs hover:bg-amber-50 shrink-0 cursor-pointer shadow-xs active:scale-95 transition ml-2"
                >
                  Input API Key &rarr;
                </button>
              </div>
            )}

            {/* Navigation Tabs & Search Controls */}
            <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              {/* Horizontal Scrollable Tabs Bar with Clear Tactile Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-100 rounded-2xl w-full md:w-auto text-xs font-bold no-scrollbar">
                {/* Tab 1: Manajemen Iklan */}
                <button
                  type="button"
                  onClick={() => setActiveTab('listings')}
                  className={`px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
                    activeTab === 'listings'
                      ? 'bg-sky-600 text-white font-black shadow-md ring-2 ring-sky-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold shadow-2xs'
                  }`}
                >
                  <Layers className={`w-4 h-4 ${activeTab === 'listings' ? 'text-white' : 'text-sky-600'}`} />
                  <span>Manajemen Iklan</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'listings' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {listings.length}
                  </span>
                </button>

                {/* Tab 2: Manajemen Pengguna */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('users');
                    setUserFilter('all');
                  }}
                  className={`px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
                    activeTab === 'users'
                      ? 'bg-sky-600 text-white font-black shadow-md ring-2 ring-sky-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold shadow-2xs'
                  }`}
                >
                  <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-white' : 'text-sky-600'}`} />
                  <span>Manajemen Pengguna</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'users' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {allUsersList.length}
                  </span>
                </button>

                {/* Tab 3: Laporan Iklan (Sistem Notifikasi & Moderasi Pelaporan Pembeli) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className={`px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
                    activeTab === 'reports'
                      ? 'bg-rose-700 text-white font-black shadow-md ring-2 ring-rose-300'
                      : 'bg-white hover:bg-rose-50 text-slate-700 border border-slate-200 font-bold shadow-2xs'
                  }`}
                >
                  <Flag className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-rose-600'}`} />
                  <span>Laporan Iklan</span>
                  {pendingReportCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                      {pendingReportCount} Baru
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'reports' ? 'bg-rose-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {adReports.length}
                    </span>
                  )}
                </button>

                {/* Tab 4: Log Notifikasi Email */}
                <button
                  type="button"
                  onClick={() => setActiveTab('emailLogs')}
                  className={`px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
                    activeTab === 'emailLogs'
                      ? 'bg-sky-600 text-white font-black shadow-md ring-2 ring-sky-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold shadow-2xs'
                  }`}
                >
                  <Mail className={`w-4 h-4 ${activeTab === 'emailLogs' ? 'text-white' : 'text-sky-600'}`} />
                  <span>Log Notifikasi Email</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'emailLogs' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {emailLogs.length}
                  </span>
                </button>

                {/* Tab 5: API Key Brevo */}
                <button
                  type="button"
                  onClick={() => setActiveTab('brevoConfig')}
                  className={`px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
                    activeTab === 'brevoConfig'
                      ? 'bg-amber-400 text-amber-950 font-black shadow-md ring-2 ring-amber-300'
                      : 'bg-amber-100/90 text-amber-950 hover:bg-amber-200 font-extrabold border border-amber-300 shadow-2xs'
                  }`}
                >
                  <Key className="w-4 h-4 text-amber-800" />
                  <span>🔑 API Key Brevo</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-600 text-white font-black">
                    WAJIB
                  </span>
                </button>
              </div>

              {/* Controls Khusus Tab Iklan */}
              {activeTab === 'listings' && (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari ID Iklan / Judul / Seller..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="all">Semua Status ({listings.length})</option>
                    <option value="sundul">Sundul Aktif ({listings.filter((l) => !!l.sundulAt).length})</option>
                    <option value="superbu">BU Prioritas ({listings.filter((l) => !!l.isSuperBU).length})</option>
                  </select>
                </div>
              )}


              {/* Controls Khusus Tab Laporan Iklan: Pencarian & Filter Status */}
              {activeTab === 'reports' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      placeholder="Cari Judul / Pelapor / Alasan / ID..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => setReportFilter('all')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        reportFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua ({adReports.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportFilter('pending')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        reportFilter === 'pending'
                          ? 'bg-rose-600 text-white shadow-xs font-black'
                          : 'text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      <span>Perlu Tindakan</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                        {pendingReportCount}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportFilter('resolved')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        reportFilter === 'resolved'
                          ? 'bg-emerald-600 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tuntas ({adReports.filter((r) => r.status === 'resolved').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportFilter('dismissed')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        reportFilter === 'dismissed'
                          ? 'bg-slate-700 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Diabaikan ({adReports.filter((r) => r.status === 'dismissed').length})
                    </button>

                    <button
                      type="button"
                      onClick={handleTriggerDemoReport}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-xs active:scale-95 transition flex items-center gap-1 cursor-pointer shrink-0 ml-1"
                      title="Klik untuk memuat 1 simulasi iklan terlapor untuk diuji coba langsung"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>+ Simulasi Laporan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TAB CONTENT 1: TABEL MANAJEMEN IKLAN */}
            {activeTab === 'listings' && (
              <div className="flex-1 overflow-auto p-4 min-h-0">
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                  <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-3.5 py-3">ID Iklan</th>
                        <th className="px-3.5 py-3">Judul Iklan</th>
                        <th className="px-3.5 py-3">Pengiklan</th>
                        <th className="px-3.5 py-3 text-center">Status Sundul</th>
                        <th className="px-3.5 py-3 text-center">Status BU Prioritas</th>
                        <th className="px-3.5 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredListings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            Tidak ada iklan yang sesuai dengan pencarian "{searchQuery}"
                          </td>
                        </tr>
                      ) : (
                        filteredListings.map((listing) => {
                          const isSundulActive = !!listing.sundulAt;
                          const isSuperBUActive = !!listing.isSuperBU;

                          return (
                            <tr key={listing.id} className="hover:bg-slate-50/80 transition">
                              {/* Kolom ID Iklan */}
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 text-[11px]">
                                    {listing.id}
                                  </span>
                                  <button
                                    onClick={() => handleCopyId(listing.id)}
                                    title="Salin ID Iklan"
                                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                  >
                                    {copiedId === listing.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Kolom Judul & Detail */}
                              <td className="px-3.5 py-3">
                                <div className="flex items-center gap-2.5 min-w-[200px]">
                                  {listing.imageUrl && (
                                    <img
                                      src={listing.imageUrl}
                                      alt={listing.title}
                                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                    />
                                  )}
                                  <div className="truncate">
                                    <p className="font-bold text-slate-900 truncate max-w-xs">
                                      {listing.title}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                      <span className="font-bold text-emerald-700">
                                        Rp {listing.sellingPrice.toLocaleString('id-ID')}
                                      </span>
                                      <span>•</span>
                                      <span className="truncate">{listing.location}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Kolom Pengiklan */}
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                <div className="text-xs">
                                  <span className="font-bold text-slate-900 block">
                                    {listing.seller?.name || 'Tanpa Nama'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {listing.seller?.phoneMasked || '0812-XXXX-XXXX'}
                                  </span>
                                </div>
                              </td>

                              {/* Kolom Status Sundul + 1-Click Toggle */}
                              <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                <div className="inline-flex flex-col items-center gap-1">
                                  <button
                                    onClick={() => handleToggleSundulWithEmail(listing)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-black border transition cursor-pointer flex items-center gap-1 ${
                                      isSundulActive
                                        ? 'bg-sky-500 text-white border-sky-600 shadow-xs hover:bg-sky-600'
                                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-sky-50 hover:text-sky-700'
                                    }`}
                                  >
                                    <ArrowUp className="w-3 h-3 stroke-[3]" />
                                    <span>{isSundulActive ? 'Aktif (#1)' : 'Nonaktif'}</span>
                                  </button>
                                  {isSundulActive && listing.sundulAt && (
                                    <span className="text-[9px] text-slate-400 font-mono">
                                      {new Date(listing.sundulAt).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Kolom Status BU Prioritas + 1-Click Toggle */}
                              <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                <div className="inline-flex flex-col items-center gap-1">
                                  <button
                                    onClick={() => handleToggleSuperBUWithEmail(listing)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-black border transition cursor-pointer flex items-center gap-1 ${
                                      isSuperBUActive
                                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs hover:bg-amber-600 animate-pulse'
                                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-800'
                                    }`}
                                  >
                                    <Flame className="w-3 h-3 fill-current" />
                                    <span>{isSuperBUActive ? 'PALING BU' : 'Nonaktif'}</span>
                                  </button>
                                  {isSuperBUActive && (
                                    <span className="text-[9px] text-amber-700 font-bold">
                                      24 Jam Aktif
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Kolom Aksi */}
                              <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {onViewListingDetail && (
                                    <button
                                      onClick={() => onViewListingDetail(listing)}
                                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                      title="Lihat Detail Iklan"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteWithConfirmation(listing)}
                                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title="Hapus Iklan Permanen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: MANAJEMEN PENGGUNA TERDAFTAR & REGISTRASI BARU */}
            {activeTab === 'users' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 min-h-0 space-y-4">
                {/* 1. KONTROL UTAMA: PENCARIAN CERDAS & FILTER STATUS */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3 shadow-2xs">
                  {/* Baris 1: Kolom Pencarian Cerdas + Tombol Mode Tampilan (Kartu vs Tabel) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Input Pencarian dengan Clear Button ✕ */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Cari Nama / Email / No. WA (628.. atau 08..) / User ID..."
                        className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium shadow-2xs"
                      />
                      {userSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setUserSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                          title="Hapus pencarian"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Mode Tampilan Toggle (Kartu vs Tabel) */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl self-end sm:self-auto shrink-0 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setUserViewMode('card')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          userViewMode === 'card'
                            ? 'bg-sky-600 text-white shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Tampilan Kartu (Optimal untuk HP & Layar Sentuh)"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Kartu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserViewMode('table')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          userViewMode === 'table'
                            ? 'bg-sky-600 text-white shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Tampilan Tabel (Data Luas untuk Komputer)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Tabel</span>
                      </button>
                    </div>
                  </div>

                  {/* Baris 2: Filter Status Pills & Action Toolbar (Refresh + Export CSV/XLS/PDF) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1 border-t border-slate-200/80">
                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs">
                      <button
                        type="button"
                        onClick={() => setUserFilter('all')}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer font-bold ${
                          userFilter === 'all'
                            ? 'bg-slate-900 text-white font-black shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Semua ({allUsersList.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserFilter('new')}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer font-bold flex items-center gap-1 ${
                          userFilter === 'new'
                            ? 'bg-emerald-600 text-white font-black shadow-xs ring-2 ring-emerald-300'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Baru Daftar ({newUsersCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserFilter('active')}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer font-bold ${
                          userFilter === 'active'
                            ? 'bg-sky-600 text-white font-black shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Aktif ({activeUsersCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserFilter('blocked')}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer font-bold ${
                          userFilter === 'blocked'
                            ? 'bg-rose-600 text-white font-black shadow-xs'
                            : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                        }`}
                      >
                        Diblokir ({blockedUsersCount})
                      </button>
                    </div>

                    {/* Toolbar Tombol Aksi: Refresh & Export */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={handleRefreshUsers}
                        disabled={isRefreshingUsers}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-xs font-black flex items-center gap-1.5 shadow-2xs active:scale-95 transition cursor-pointer"
                        title="Segarkan data pendaftar baru dari database Supabase & server"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
                        <span>{isRefreshingUsers ? 'Menyinkronkan...' : 'Refresh'}</span>
                      </button>

                      <div className="h-4 w-px bg-slate-300 mx-0.5 hidden sm:block"></div>

                      <button
                        type="button"
                        onClick={() => {
                          exportUsersToCSV(filteredUsersList);
                          showNotification(`📥 File CSV (${filteredUsersList.length} pengguna) berhasil diunduh!`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition cursor-pointer"
                        title="Download format CSV"
                      >
                        <Download className="w-3.5 h-3.5 text-sky-600" />
                        <span>CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportUsersToXLS(filteredUsersList);
                          showNotification(`📥 File Excel XLS (${filteredUsersList.length} pengguna) berhasil diunduh!`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black flex items-center gap-1 shadow-2xs active:scale-95 transition cursor-pointer"
                        title="Download format Excel (.XLS)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>XLS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportUsersToPDF(filteredUsersList);
                          showNotification(`🖨️ Menyiapkan cetak PDF (${filteredUsersList.length} pengguna)...`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-black flex items-center gap-1 shadow-2xs active:scale-95 transition cursor-pointer"
                        title="Cetak PDF Laporan"
                      >
                        <Printer className="w-3.5 h-3.5 text-rose-600" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Indikator Status Pencarian & Hasil Filter */}
                  {userSearchQuery && (
                    <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs text-sky-950 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-sky-600" />
                        <span>
                          Ditemukan <strong>{filteredUsersList.length}</strong> pengguna cocok untuk pencarian &ldquo;<strong>{userSearchQuery}</strong>&rdquo;
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUserSearchQuery('')}
                        className="text-xs text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
                      >
                        Reset Pencarian
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. DAFTAR DATA PENGGUNA (CARD VIEW & TABLE VIEW) */}
                {filteredUsersList.length === 0 ? (
                  /* EMPTY STATE */
                  <div className="p-8 sm:p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-black text-slate-800">
                      {userSearchQuery ? 'Pengguna Tidak Ditemukan' : 'Belum Ada Data Pengguna'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      {userSearchQuery
                        ? `Tidak ada data pengguna atau nomor WhatsApp yang cocok dengan "${userSearchQuery}". Coba ketik sebagian nomor telepon atau nama akun.`
                        : userFilter === 'new'
                        ? 'Belum ada pendaftaran akun baru dalam 7 hari terakhir.'
                        : userFilter === 'blocked'
                        ? 'Tidak ada pengguna yang sedang diblokir.'
                        : 'Belum ada pendaftar akun tersimpan.'}
                    </p>
                    {userSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setUserSearchQuery('')}
                        className="mt-4 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-sm active:scale-95 transition cursor-pointer"
                      >
                        Tampilkan Semua Pengguna
                      </button>
                    )}
                  </div>
                ) : userViewMode === 'card' ? (
                  /* CARD VIEW (Sangat Rapi, Mudah Dibaca & Praktis untuk Mobile & Desktop) */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredUsersList.map((user) => {
                      const isBlocked = blockedUserIds.includes(user.id) || user.status === 'blocked';
                      const cleanWa = user.whatsapp || user.phone || '';
                      const isNew = isNewUser(user.registeredAt);
                      const currentQuota = typeof user.listingQuota === 'number' ? user.listingQuota : getUserQuota(user.id);

                      return (
                        <div
                          key={user.id}
                          className={`p-4 rounded-3xl border transition shadow-xs hover:shadow-md bg-white ${
                            isNew
                              ? 'border-emerald-300 ring-2 ring-emerald-100'
                              : isBlocked
                              ? 'border-rose-200 bg-rose-50/20'
                              : 'border-slate-200'
                          }`}
                        >
                          {/* Header Kartu: Avatar, Nama, Status & Badge Baru */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                                  isBlocked
                                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                                    : isNew
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-sky-100 text-sky-800 border-sky-200'
                                }`}
                              >
                                {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-black text-slate-900 text-sm truncate">
                                    {user.name}
                                  </h4>
                                  {isNew && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white animate-pulse">
                                      🆕 BARU
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      user.role === 'seller'
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {user.role === 'seller' ? 'Penjual' : 'Pembeli'}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600">
                                    {user.id}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyId(user.id)}
                                    title="Salin ID Pengguna"
                                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                  >
                                    {copiedId === user.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <span>•</span>
                                  <span title={user.registeredAt}>
                                    {formatRelativeTime(user.registeredAt)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Akun Pill */}
                            <div>
                              {isBlocked ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                                  <UserX className="w-3 h-3 text-rose-600" />
                                  <span>DIBLOKIR</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  <span>AKTIF</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Kontak Info: WhatsApp & Email */}
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            {/* WhatsApp & Chat Direct Button */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-mono font-bold text-slate-900 truncate">
                                  {cleanWa || '-'}
                                </span>
                              </div>
                              {cleanWa && (
                                <a
                                  href={getWhatsAppChatLink(
                                    cleanWa,
                                    `Halo kak ${user.name}, salam dari Admin JualRugi.my.id! 🎉`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 shrink-0 shadow-2xs active:scale-95 transition cursor-pointer"
                                  title="Buka Chat WhatsApp Langsung"
                                >
                                  <MessageCircle className="w-3 h-3 fill-white" />
                                  <span>Chat WA</span>
                                </a>
                              )}
                            </div>

                            {/* Email Link */}
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <a
                                href={`mailto:${user.email}`}
                                className="text-slate-700 hover:text-sky-600 font-medium truncate underline decoration-slate-300"
                                title="Kirim email"
                              >
                                {user.email}
                              </a>
                            </div>
                          </div>

                          {/* Detail Ringkas: Kota & Jumlah Iklan */}
                          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-1">
                            <span>Lokasi: <strong>{user.city || 'Indonesia'}</strong></span>
                            <span>Iklan Tayang: <strong>{user.count || 0} Iklan</strong></span>
                          </div>

                          {/* ACTION SECTION: TAMBAH KUOTA MANUAL & MODERASI BLOKIR */}
                          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                            {/* Badge Kuota Saat Ini */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Kuota:
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 font-mono font-black text-xs">
                                {currentQuota} Slot
                              </span>
                            </div>

                            {/* 3 Tombol Tambah Kuota Manual (+1, +5, +10 Kuota) */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddQuotaManual(
                                    user.id,
                                    user.name,
                                    user.email,
                                    user.whatsapp || user.phone || '',
                                    1
                                  )
                                }
                                className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Tambah 1 Kuota (Kirim notifikasi otomatis Email & WhatsApp)"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+1 Kuota</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleAddQuotaManual(
                                    user.id,
                                    user.name,
                                    user.email,
                                    user.whatsapp || user.phone || '',
                                    5
                                  )
                                }
                                className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Tambah 5 Kuota (Kirim notifikasi otomatis Email & WhatsApp)"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+5 Kuota</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleAddQuotaManual(
                                    user.id,
                                    user.name,
                                    user.email,
                                    user.whatsapp || user.phone || '',
                                    10
                                  )
                                }
                                className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Tambah 10 Kuota (Kirim notifikasi otomatis Email & WhatsApp)"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+10 Kuota</span>
                              </button>

                              {/* Tombol Blokir / Buka Blokir */}
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleBlockUser(user.id, !isBlocked);
                                  showNotification(
                                    isBlocked
                                      ? `✅ Blokir untuk ${user.name} telah dibuka.`
                                      : `⛔ Pengguna ${user.name} berhasil diblokir.`
                                  );
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ml-auto sm:ml-1 ${
                                  isBlocked
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                }`}
                                title={isBlocked ? 'Buka blokir akun ini' : 'Blokir akun pengguna ini'}
                              >
                                {isBlocked ? 'Buka Blokir' : 'Blokir'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* TABLE VIEW (Untuk Monitor Desktop dengan Kolom Sticky & Rapi) */
                  <div className="overflow-x-auto border border-slate-200 rounded-3xl shadow-xs bg-white">
                    <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                        <tr>
                          <th className="px-3.5 py-3">ID Pengguna</th>
                          <th className="px-3.5 py-3">Nama Lengkap</th>
                          <th className="px-3.5 py-3">Alamat Email</th>
                          <th className="px-3.5 py-3">Nomor WhatsApp</th>
                          <th className="px-3.5 py-3">Tgl Daftar</th>
                          <th className="px-3.5 py-3 text-center">Status</th>
                          <th className="px-3.5 py-3 text-center">Tambah Kuota Manual</th>
                          <th className="px-3.5 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredUsersList.map((user) => {
                          const isBlocked = blockedUserIds.includes(user.id) || user.status === 'blocked';
                          const cleanWa = user.whatsapp || user.phone || '';
                          const isNew = isNewUser(user.registeredAt);
                          const currentQuota = typeof user.listingQuota === 'number' ? user.listingQuota : getUserQuota(user.id);

                          return (
                            <tr
                              key={user.id}
                              className={`hover:bg-slate-50/80 transition ${
                                isNew ? 'bg-emerald-50/20' : ''
                              }`}
                            >
                              {/* 1. ID Pengguna */}
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 text-[11px]">
                                    {user.id}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyId(user.id)}
                                    title="Salin ID Pengguna"
                                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                                  >
                                    {copiedId === user.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* 2. Nama Lengkap */}
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-900 text-xs">
                                    {user.name}
                                  </span>
                                  {isNew && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white animate-pulse">
                                      BARU
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 capitalize">
                                  Role: <strong className="text-slate-600">{user.role || 'buyer'}</strong> • {user.count || 0} Iklan
                                </span>
                              </td>

                              {/* 3. Alamat Email */}
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                <a
                                  href={`mailto:${user.email}`}
                                  className="text-slate-800 hover:text-sky-600 font-medium flex items-center gap-1.5 group"
                                  title="Kirim email ke pengguna"
                                >
                                  <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0" />
                                  <span className="font-medium underline decoration-slate-200 underline-offset-2">
                                    {user.email}
                                  </span>
                                </a>
                              </td>

                              {/* 4. Nomor WhatsApp + Tombol Direct Chat WA */}
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900 text-xs">
                                    {cleanWa || '-'}
                                  </span>
                                  {cleanWa && (
                                    <a
                                      href={getWhatsAppChatLink(
                                        cleanWa,
                                        `Halo kak ${user.name}, salam dari tim JualRugi.my.id! 🎉`
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black shadow-2xs active:scale-95 transition cursor-pointer"
                                      title="Kirim Pesan WhatsApp Langsung (Chat WA)"
                                    >
                                      <MessageCircle className="w-3 h-3 fill-white" />
                                      <span>Chat WA</span>
                                    </a>
                                  )}
                                </div>
                              </td>

                              {/* 5. Tanggal Pendaftaran */}
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                <span className="text-slate-700 font-mono text-[11px] block">
                                  {formatRelativeTime(user.registeredAt)}
                                </span>
                                {user.city && (
                                  <span className="text-[10px] text-slate-400">
                                    {user.city}
                                  </span>
                                )}
                              </td>

                              {/* 6. Status Akun */}
                              <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                {isBlocked ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                    <UserX className="w-3 h-3 text-rose-600" />
                                    Diblokir
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <UserCheck className="w-3 h-3 text-emerald-600" />
                                    Aktif
                                  </span>
                                )}
                              </td>

                              {/* 7. Kuota Iklan & Tambah Kuota Manual (+1, +5, +10 Kuota) */}
                              <td className="px-3.5 py-3 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1.5">
                                  <span className="font-mono font-black text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md text-[11px]">
                                    {currentQuota} Kuota
                                  </span>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleAddQuotaManual(user.id, user.name, user.email, user.whatsapp || user.phone || '', 1)}
                                      className="px-2 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-[10px] shadow-2xs transition cursor-pointer"
                                      title="Tambah 1 Kuota Iklan (Kirim Double Notifikasi Email & WhatsApp)"
                                    >
                                      +1 Kuota
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAddQuotaManual(user.id, user.name, user.email, user.whatsapp || user.phone || '', 5)}
                                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[10px] shadow-2xs transition cursor-pointer"
                                      title="Tambah 5 Kuota Iklan (Kirim Double Notifikasi Email & WhatsApp)"
                                    >
                                      +5 Kuota
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAddQuotaManual(user.id, user.name, user.email, user.whatsapp || user.phone || '', 10)}
                                      className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-[10px] shadow-2xs transition cursor-pointer"
                                      title="Tambah 10 Kuota Iklan (Kirim Double Notifikasi Email & WhatsApp)"
                                    >
                                      +10 Kuota
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* 8. Aksi Moderasi */}
                              <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onToggleBlockUser(user.id, !isBlocked);
                                    showNotification(
                                      isBlocked
                                        ? `Blokir untuk ${user.name} telah dibuka.`
                                        : `Pengguna ${user.name} berhasil diblokir.`
                                    );
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ml-auto ${
                                    isBlocked
                                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100'
                                  }`}
                                >
                                  {isBlocked ? (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Buka Blokir</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Blokir</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: LOG NOTIFIKASI EMAIL */}
            {activeTab === 'emailLogs' && (
              <div className="flex-1 overflow-auto p-4 min-h-0">
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-sky-600" />
                      <span>Audit Trail Notifikasi Email Otomatis</span>
                    </div>
                    <button
                      onClick={loadEmailLogs}
                      className="text-sky-600 hover:text-sky-800 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Segarkan
                    </button>
                  </div>

                  {emailLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Belum ada riwayat email notifikasi yang terkirim. Klik tombol toggle Sundul atau BU Prioritas untuk memicu email otomatis.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {emailLogs.map((log) => (
                        <div key={log.id} className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{log.recipientEmail}</span>
                              <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-100">
                                {log.listingId}
                              </span>
                              {log.packageType && (
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                  {log.packageType}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 text-[11px] mt-1 font-medium">
                              "{log.listingTitle || 'Iklan JualRugi'}"
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Tautan: <span className="font-mono text-sky-600">{log.adLink}</span>
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                            {new Date(log.sentAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PENGATURAN API KEY BREVO (SUPER LENGKAP & MENCALOK) */}
            {activeTab === 'brevoConfig' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0">
                {/* Header Card */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg border-2 border-amber-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 flex items-center justify-center shrink-0 shadow-md">
                        <Key className="w-7 h-7 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-black text-white">
                            PENGATURAN API KEY BREVO (EMAIL RESMI)
                          </h4>
                          {brevoKeyInput && brevoKeyInput.startsWith('xkeysib-') ? (
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" />
                              <span>API Key Aktif</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1 shadow-xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              <span>Belum Dikonfigurasi</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/95 mt-1 leading-relaxed">
                          Digunakan untuk mengirimkan <strong>Welcome Email Pengguna Baru</strong> dan <strong>Notifikasi Iklan Tayang</strong> ke inbox email pelanggan tanpa error.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://app.brevo.com/settings/keys/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-white text-orange-700 hover:bg-amber-50 font-black text-xs shadow-md transition active:scale-95 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Buka Halaman API Key di Brevo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Warning Callout Box */}
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>PERINGATAN PENTING: Perbedaan "brevo-code" vs "API Key"</span>
                  </div>
                  <p className="leading-relaxed">
                    Kode yang berawalan <code className="bg-amber-200 px-1.5 py-0.5 rounded text-amber-950 font-bold">brevo-code:4c91afdd...</code> adalah <strong>kode DNS TXT untuk verifikasi domain</strong> di Cloudflare, <strong>BUKAN API Key</strong>.
                  </p>
                  <p className="leading-relaxed">
                    API Key resmi Brevo v3 <strong>SELALU diawali dengan huruf <code className="bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-950 font-bold">xkeysib-...</code></strong> (panjang sekitar 75 karakter). Jika Anda memasukkan `brevo-code`, server Brevo akan menolak pengiriman email.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form Input API Key */}
                  <form onSubmit={handleSaveBrevoConfig} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h5 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Key className="w-4 h-4 text-sky-600" />
                        <span>Form Input Kunci API</span>
                      </h5>
                      <span className="text-[11px] font-bold text-slate-400">Tersimpan Otomatis</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Brevo API Key (v3 - wajib diawali <code className="text-sky-600">xkeysib-...</code>):
                      </label>
                      <div className="relative">
                        <input
                          type={showKeyPassword ? 'text' : 'password'}
                          value={brevoKeyInput}
                          onChange={(e) => setBrevoKeyInput(e.target.value.trim())}
                          placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeyPassword(!showKeyPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showKeyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Dapatkan dari menu Brevo: <em>Settings &gt; SMTP &amp; API &gt; API Keys &gt; Generate a new API key</em>.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Email Pengirim Terverifikasi (Sender Email):
                      </label>
                      <input
                        type="email"
                        value={brevoSenderEmail}
                        onChange={(e) => setBrevoSenderEmail(e.target.value.trim())}
                        placeholder="admin@jualrugi.my.id"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono bg-slate-50/50"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Default resmi domain: <code className="font-bold text-slate-700">admin@jualrugi.my.id</code>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Nama Pengirim (Sender Name):
                      </label>
                      <input
                        type="text"
                        value={brevoSenderName}
                        onChange={(e) => setBrevoSenderName(e.target.value)}
                        placeholder="JualRugi.my.id"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingBrevo}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSavingBrevo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Menyimpan ke Sistem...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>💾 Simpan Konfigurasi Brevo Sekarang</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Tool Tes Kirim Email Langsung */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h5 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <Send className="w-4 h-4 text-emerald-600" />
                          <span>Uji Coba Pengiriman Email (Live Test)</span>
                        </h5>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          Diagnostik
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Kirimkan email uji coba ke alamat email Anda untuk memastikan API Key Brevo bekerja 100% dan tidak ditolak oleh server.
                      </p>

                      {/* Pilihan Jenis Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Pilih Jenis Email untuk Dites:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setTestEmailType('welcome')}
                            className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center gap-2 ${
                              testEmailType === 'welcome'
                                ? 'bg-sky-50 border-sky-500 text-sky-800 ring-2 ring-sky-300'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Mail className="w-4 h-4 text-sky-600" />
                            <span>1. Welcome Email</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTestEmailType('adPublished')}
                            className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center gap-2 ${
                              testEmailType === 'adPublished'
                                ? 'bg-sky-50 border-sky-500 text-sky-800 ring-2 ring-sky-300'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>2. Iklan Tayang</span>
                          </button>
                        </div>
                      </div>

                      {/* Email Tujuan */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Kirim Tes ke Email:
                        </label>
                        <input
                          type="email"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value.trim())}
                          placeholder="bca.ccpl@gmail.com"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSendTestEmail}
                        disabled={isSendingTest}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSendingTest ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Menghubungi Brevo &amp; Mengirim...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-white" />
                            <span>🚀 Kirim Email Uji Coba Sekarang</span>
                          </>
                        )}
                      </button>

                      {/* Live Status Response Feedback Box */}
                      {testStatus && (
                        <div
                          className={`p-3.5 rounded-2xl text-xs space-y-1.5 border animate-fade-in ${
                            testStatus.success
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-rose-50 border-rose-300 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-black">
                            {testStatus.success ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span>{testStatus.success ? 'Berhasil Terkirim!' : 'Pengiriman Gagal!'}</span>
                          </div>
                          <p className="leading-relaxed font-medium">{testStatus.message}</p>
                          {testStatus.details && (
                            <div className="p-2 rounded-xl bg-black/5 font-mono text-[10px] break-all">
                              Provider: {testStatus.details.provider || 'unknown'} • ID: {testStatus.details.messageId || testStatus.details.brevoMessageId || '-'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: LAPORAN IKLAN OLEH PEMBELI (PUSAT MODERASI ANTI-FRAUD) */}
            {activeTab === 'reports' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 min-h-0 bg-slate-50/50">
                {/* Header Banner Moderasi (Compact & Tactile) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white shadow-md border border-rose-400">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldAlert className="w-5 h-5 text-rose-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-black text-white">
                            MODERASI &amp; PELAPORAN IKLAN ANTI-FRAUD
                          </h4>
                          {pendingReportCount > 0 ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 flex items-center gap-1 shadow-2xs animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-amber-950" />
                              <span>{pendingReportCount} Butuh Tindakan</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-950" />
                              <span>Bersih</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/90 mt-0.5 line-clamp-1 sm:line-clamp-none">
                          Kelola laporan pembeli atas indikasi penipuan transfer DP, barang palsu, atau seller curang.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTriggerDemoReport}
                      className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 self-stretch sm:self-center"
                      title="Klik untuk memunculkan 1 data simulasi laporan iklan untuk uji coba tombol aksi"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-950" />
                      <span>⚡ Simulasi 1 Iklan Terlaporkan</span>
                    </button>
                  </div>
                </div>

                {/* SOP Penanganan Fraud Callout Singkat */}
                <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="text-[11px] font-semibold text-amber-900 leading-tight">
                      <strong>SOP COD 100% Aman:</strong> Dilarang keras transfer DP sebelum COD. Jika penjual memaksa transfer DP, segera klik tombol <strong>Take Down Iklan</strong> dan <strong>Blokir Penjual</strong>.
                    </span>
                  </div>
                </div>

                {/* Daftar Kartu Laporan Iklan */}
                {filteredReportsList.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h5 className="font-black text-slate-800 text-sm sm:text-base">Belum Ada Laporan Aktif</h5>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      {reportSearchQuery
                        ? `Tidak ada laporan yang cocok dengan kata kunci "${reportSearchQuery}".`
                        : 'Semua laporan pembeli telah selesai ditindaklanjuti.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleTriggerDemoReport}
                      className="mt-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Muat Simulasi 1 Iklan Terlaporkan</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredReportsList.map((report) => {
                      const matchedListing = listings.find((l) => l.id === report.listingId);
                      const isSellerBlocked = blockedUserIds.includes(report.sellerId);
                      const isPending = report.status === 'pending' || report.status === 'investigating';
                      const isDemoSimulation = report.id.startsWith('rep-sim') || report.id === 'rep-demo-001';

                      // Format WhatsApp Seller dan Pelapor
                      const sellerCleanPhone = (report.sellerWhatsapp || '').replace(/\D/g, '');
                      const reporterCleanPhone = (report.reporterContact || '').replace(/\D/g, '');

                      const waSellerUrl = sellerCleanPhone
                        ? `https://wa.me/${sellerCleanPhone.startsWith('0') ? '62' + sellerCleanPhone.slice(1) : sellerCleanPhone}?text=${encodeURIComponent(
                            `Halo kak ${report.sellerName}, kami dari Tim Admin Resmi JualRugi.my.id. Terkait iklan "${report.listingTitle}" (ID: ${report.listingId}), kami menerima laporan pembeli mengenai indikasi pelanggaran aturan transaksi: ${report.reasonLabel}. Mohon konfirmasi.`
                          )}`
                        : undefined;

                      const waReporterUrl = reporterCleanPhone && reporterCleanPhone.length >= 8
                        ? `https://wa.me/${reporterCleanPhone.startsWith('0') ? '62' + reporterCleanPhone.slice(1) : reporterCleanPhone}?text=${encodeURIComponent(
                            `Halo kak ${report.reporterName}, terima kasih atas laporannya di JualRugi.my.id mengenai iklan "${report.listingTitle}". Tim Admin telah menindaklanjuti laporan Anda demi keamanan bersama.`
                          )}`
                        : undefined;

                      return (
                        <div
                          key={report.id}
                          className={`bg-white rounded-2xl sm:rounded-3xl border transition-all shadow-sm overflow-hidden ${
                            isPending
                              ? 'border-rose-400 ring-2 ring-rose-200'
                              : report.status === 'resolved'
                              ? 'border-emerald-300'
                              : 'border-slate-200 opacity-90'
                          }`}
                        >
                          {/* Top Card Bar: ID, Tanggal, Severity & Status */}
                          <div className={`px-3.5 sm:px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs border-b ${
                            isPending ? 'bg-rose-50/80 border-rose-200' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                                {report.id}
                              </span>

                              {isDemoSimulation && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 font-black text-[10px] flex items-center gap-1 shadow-2xs">
                                  <Sparkles className="w-3 h-3 text-amber-950" />
                                  <span>SIMULASI UJI COBA</span>
                                </span>
                              )}

                              <span className="text-[11px] text-slate-500 font-medium">
                                {formatIndoDate(report.createdAt)}
                              </span>

                              {/* Badge Alasan / Severity */}
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  report.reason === 'dp_scam' || report.reason === 'fake_goods' || report.reason === 'stolen_illegal'
                                    ? 'bg-red-600 text-white'
                                    : report.reason === 'fake_price'
                                    ? 'bg-amber-500 text-amber-950'
                                    : 'bg-slate-600 text-white'
                                }`}
                              >
                                {report.reasonLabel}
                              </span>
                            </div>

                            {/* Status Laporan Badge */}
                            <div>
                              {report.status === 'pending' ? (
                                <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-[11px] flex items-center gap-1 shadow-2xs animate-pulse">
                                  <AlertTriangle className="w-3 h-3 text-white" />
                                  <span>PERLU TINDAKAN</span>
                                </span>
                              ) : report.status === 'investigating' ? (
                                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-amber-950 font-black text-[11px] flex items-center gap-1 shadow-2xs">
                                  <Search className="w-3 h-3 text-amber-950" />
                                  <span>SEDANG DIINVESTIGASI</span>
                                </span>
                              ) : report.status === 'resolved' ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center gap-1 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                  <span>SELESAI / DITINDAK</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1">
                                  <EyeOff className="w-3 h-3 text-slate-500" />
                                  <span>DIABAIKAN</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Body Card: Grid 2 Kolom (Info Iklan vs Info Pelapor & Penjual) */}
                          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            {/* Kolom 1: Produk yang Dilaporkan */}
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                {report.listingImageUrl ? (
                                  <img
                                    src={report.listingImageUrl}
                                    alt={report.listingTitle}
                                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                    <Layers className="w-8 h-8" />
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <h6 className="font-black text-sm text-slate-900 leading-snug line-clamp-2">
                                    {report.listingTitle}
                                  </h6>
                                  <div className="text-emerald-700 font-black text-xs mt-1">
                                    Rp {report.listingPrice.toLocaleString('id-ID')}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{report.listingLocation || 'Lokasi tidak dicantumkan'}</span>
                                    <span>•</span>
                                    <span className="font-mono text-slate-600 font-bold">ID: {report.listingId}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Status Iklan di Platform saat ini */}
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                                <span className="text-slate-600 font-bold">Status Tayang Platform:</span>
                                {matchedListing ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    <span>Aktif Tayang</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px]">
                                    Iklan Sudah Dihapus / Di-takedown
                                  </span>
                                )}
                              </div>

                              {/* Tombol Lihat Iklan Langsung */}
                              {matchedListing && onViewListingDetail && (
                                <button
                                  type="button"
                                  onClick={() => onViewListingDetail(matchedListing)}
                                  className="w-full py-2 px-3 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Buka &amp; Periksa Detail Iklan Ini</span>
                                </button>
                              )}
                            </div>

                            {/* Kolom 2: Kronologi Pelapor & Detail Penjual */}
                            <div className="pt-3 md:pt-0 md:pl-4 space-y-3">
                              {/* Kronologi yang disampaikan pembeli */}
                              <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wide flex items-center gap-1 mb-1">
                                  <Flag className="w-3 h-3 text-rose-600" />
                                  <span>Kronologi / Catatan Pembeli:</span>
                                </label>
                                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-950 font-medium leading-relaxed">
                                  {report.notes ? `"${report.notes}"` : 'Pembeli tidak menyertakan catatan kronologi tambahan.'}
                                </div>
                              </div>

                              {/* Detail Kontak Pelapor & Penjual */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                  <div className="text-[10px] font-black uppercase text-slate-400">Pelapor (Pembeli)</div>
                                  <div className="font-extrabold text-slate-800 mt-0.5 truncate">{report.reporterName}</div>
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                                    {report.reporterContact || '-'}
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                  <div className="text-[10px] font-black uppercase text-slate-400">Penjual Terlapor</div>
                                  <div className="font-extrabold text-slate-800 mt-0.5 truncate">{report.sellerName}</div>
                                  <div className="text-[11px] font-mono mt-0.5 truncate flex items-center gap-1">
                                    <span className="text-slate-500">{report.sellerWhatsapp || '-'}</span>
                                    {isSellerBlocked && (
                                      <span className="text-[9px] px-1 rounded bg-rose-200 text-rose-800 font-black">
                                        DIBLOKIR
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Catatan Penyelesaian (Jika Ada) */}
                              {report.resolutionNotes && (
                                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                                  <div className="font-black text-[10px] uppercase text-emerald-700">
                                    Catatan Admin:
                                  </div>
                                  <div className="mt-0.5 font-medium leading-relaxed">
                                    {report.resolutionNotes}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Toolbar Bottom Bar (Moderation Actions) */}
                          <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* 1. Tombol TAKE DOWN IKLAN (Hapus Permanen & Notifikasi Seller) */}
                              {report.status !== 'resolved' && (
                                <button
                                  type="button"
                                  onClick={() => handleTakeDownReportedListing(report)}
                                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-sm flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                                  title="Hapus iklan ini dan kirim double notifikasi (alasan & kuota) ke Email dan WA seller"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>🚨 Take Down Iklan</span>
                                </button>
                              )}

                              {/* 2. Tombol BLOKIR / CEKAL PENJUAL */}
                              <button
                                type="button"
                                onClick={() => handleBlockReportedSeller(report)}
                                className={`px-3 py-2 rounded-xl font-extrabold shadow-2xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
                                  isSellerBlocked
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                    : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                                }`}
                                title={isSellerBlocked ? 'Buka blokir akun penjual ini' : 'Blokir akun penjual ini agar tidak bisa login'}
                              >
                                {isSellerBlocked ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Buka Blokir Penjual</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3.5 h-3.5 text-rose-700" />
                                    <span>⛔ Blokir Penjual</span>
                                  </>
                                )}
                              </button>

                              {/* 3. Tombol Chat WhatsApp ke Penjual */}
                              {waSellerUrl && (
                                <a
                                  href={waSellerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition"
                                  title="Kirim pesan peringatan / klarifikasi ke nomor WhatsApp penjual"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Chat Penjual</span>
                                </a>
                              )}

                              {/* 4. Tombol Chat WhatsApp ke Pelapor */}
                              {waReporterUrl && (
                                <a
                                  href={waReporterUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition"
                                  title="Beri kabar tindak lanjut ke nomor WhatsApp pelapor"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Chat Pelapor</span>
                                </a>
                              )}
                            </div>

                            {/* Tombol Status Resolusi */}
                            <div className="flex items-center gap-2 ml-auto">
                              {report.status !== 'resolved' && (
                                <button
                                  type="button"
                                  onClick={() => handleResolveReport(report.id)}
                                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                                  title="Tandai laporan ini selesai ditindaklanjuti"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Tandai Tuntas</span>
                                </button>
                              )}

                              {report.status !== 'dismissed' && report.status !== 'resolved' && (
                                <button
                                  type="button"
                                  onClick={() => handleDismissReport(report.id)}
                                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold flex items-center gap-1 active:scale-95 transition cursor-pointer"
                                  title="Abaikan laporan ini jika tidak ada indikasi pelanggaran"
                                >
                                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Abaikan</span>
                                </button>
                              )}

                              {/* Hapus Arsip */}
                              <button
                                type="button"
                                onClick={() => handleDeleteReportArchive(report.id)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus laporan dari arsip"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
