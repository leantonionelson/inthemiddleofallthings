import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  deferredPrompt: BeforeInstallPromptEvent | null;
  showInstallPrompt: boolean;
}

export const usePWAInstall = (): PWAInstallState & {
  install: () => Promise<void>;
  dismissPrompt: () => void;
  resetDismissal: () => void;
} => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'tablet'>('desktop');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Detect device and platform
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
      
      if (isTablet) {
        setDeviceType('tablet');
      } else if (isMobile) {
        setDeviceType('mobile');
      } else {
        setDeviceType('desktop');
      }

      setIsIOS(/iphone|ipad|ipod/i.test(userAgent));
      setIsAndroid(/android/i.test(userAgent));
      
      // Check if already installed
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandalone);
    };

    detectDevice();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after delay if not dismissed
      const isDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!isDismissed && !isInstalled) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const install = async (): Promise<void> => {
    // Try to use the stored deferred prompt first
    let promptToUse = deferredPrompt;
    
    // Fallback to window.deferredPrompt (set by PWAInstallPrompt component)
    if (!promptToUse && (window as any).deferredPrompt) {
      promptToUse = (window as any).deferredPrompt as BeforeInstallPromptEvent;
    }
    
    if (promptToUse) {
      try {
        await promptToUse.prompt();
        const { outcome } = await promptToUse.userChoice;
        
        if (outcome === 'accepted') {
          console.log('PWA installation accepted');
          setIsInstalled(true);
          setShowInstallPrompt(false);
        }
        
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
      } catch (error) {
        console.error('Error showing install prompt:', error);
        // If prompt fails, clear the deferred prompt
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
      }
    } else {
      console.warn('Install prompt not available. Make sure you are on HTTPS or localhost with a valid manifest.');
    }
  };

  const dismissPrompt = (): void => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const resetDismissal = (): void => {
    localStorage.removeItem('pwa-install-dismissed');
    setShowInstallPrompt(true);
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    deviceType,
    deferredPrompt,
    showInstallPrompt,
    install,
    dismissPrompt,
    resetDismissal,
  };
};
