import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Robust detection of standalone mode (installed PWA, WebAPK, or standalone app)
    const checkStandalone = (): boolean => {
      if (typeof window === 'undefined') return false;

      const isStandaloneMedia =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches;

      const isIOSStandalone =
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      const isReferrerApp =
        typeof document !== 'undefined' &&
        document.referrer &&
        document.referrer.startsWith('android-app://');

      const isSearchPWA =
        window.location.search.includes('source=pwa') ||
        window.location.search.includes('source=apk') ||
        sessionStorage.getItem('jr_is_pwa') === 'true';

      if (isSearchPWA) {
        try {
          sessionStorage.setItem('jr_is_pwa', 'true');
        } catch (_) {}
      }

      return Boolean(isStandaloneMedia || isIOSStandalone || isReferrerApp || isSearchPWA);
    };

    setIsInstalled(checkStandalone());

    // Detect iOS devices
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        sessionStorage.setItem('jr_is_pwa', 'true');
      } catch (_) {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        sessionStorage.setItem('jr_is_pwa', 'true');
      } catch (_) {}
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}
